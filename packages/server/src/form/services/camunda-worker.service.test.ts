// Copyright 2022 LiYechao
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Test } from '@nestjs/testing'
import { mongo } from 'mongoose'
import { NodeVM } from 'vm2'
import { JOB_ACTION_ACKNOWLEDGEMENT, ZBClient } from 'zeebe-node'
import { createMock, MockType } from '../../jest.utils'
import { Record } from '../schemas/record.schema'
import { CamundaWorkerService } from './camunda-worker.service'
import { RecordService } from './record.service'
import { WorkflowLogService } from './workflow-log.service'

describe('CamundaWorkerService', () => {
  let camundaWorkerService: CamundaWorkerService
  let recordService: MockType<RecordService>
  let zbClient: MockType<ZBClient>
  let workflowLogService: MockType<WorkflowLogService>

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      providers: [
        CamundaWorkerService,
        { provide: ZBClient, useFactory: createMock },
        { provide: RecordService, useFactory: createMock },
        { provide: WorkflowLogService, useFactory: createMock },
      ],
    }).compile()

    camundaWorkerService = moduleFixture.get(CamundaWorkerService)
    recordService = moduleFixture.get(RecordService)
    zbClient = moduleFixture.get(ZBClient)
    workflowLogService = moduleFixture.get(WorkflowLogService)
  })

  test('should call createWorker', async () => {
    camundaWorkerService.start()
    expect(zbClient.createWorker.mock.calls.at(0)?.at(0)).toMatchObject({ taskType: 'script_js' })
  })

  test('handle script_js task', async () => {
    const userId = new mongo.ObjectId().toHexString()
    const applicationId = new mongo.ObjectId().toHexString()
    const workflowId = new mongo.ObjectId().toHexString()
    const formId = new mongo.ObjectId().toHexString()
    const elementId = new mongo.ObjectId().toHexString()
    const complete = jest.fn(async () => JOB_ACTION_ACKNOWLEDGEMENT)
    const error = jest.fn(async () => JOB_ACTION_ACKNOWLEDGEMENT)

    const record: Record = {
      id: new mongo.ObjectId().toHexString(),
      formId: new mongo.ObjectId().toHexString(),
      userId: new mongo.ObjectId().toHexString(),
      createdAt: Date.now(),
      data: {
        foo: {
          value: '123',
        },
      },
    }

    await expect(
      camundaWorkerService['handleScriptJsTask']({
        bpmnProcessId: `Process_${workflowId}`,
        elementId,
        variables: {
          form_trigger_application_id: applicationId,
          form_trigger_form_id: formId,
          form_trigger_user_id: userId,
          form_trigger_record: record,
        },
        customHeaders: {
          script: Buffer.from(
            `export default async function () { console.log('HELLO'); outputs.foo = ['bar']; }`
          ).toString('base64'),
        },
        complete,
        error,
      })
    ).resolves.toEqual(JOB_ACTION_ACKNOWLEDGEMENT)

    expect(complete.mock.calls.at(0)?.at(0)).toMatchObject({ foo: ['bar'] })

    expect(workflowLogService.create.mock.calls.at(0)?.at(0)).toMatchObject({
      userId,
      workflowId,
      type: 'console.log',
      content: JSON.stringify(['HELLO']),
    })
  })

  test('handle script_js task error', async () => {
    const userId = new mongo.ObjectId().toHexString()
    const applicationId = new mongo.ObjectId().toHexString()
    const workflowId = new mongo.ObjectId().toHexString()
    const formId = new mongo.ObjectId().toHexString()
    const elementId = new mongo.ObjectId().toHexString()
    const complete = jest.fn(async () => JOB_ACTION_ACKNOWLEDGEMENT)
    const error = jest.fn(async () => JOB_ACTION_ACKNOWLEDGEMENT)

    const record: Record = {
      id: new mongo.ObjectId().toHexString(),
      formId: new mongo.ObjectId().toHexString(),
      userId: new mongo.ObjectId().toHexString(),
      createdAt: Date.now(),
      data: {
        foo: {
          value: '123',
        },
      },
    }

    await expect(
      camundaWorkerService['handleScriptJsTask']({
        bpmnProcessId: `Process_${workflowId}`,
        elementId,
        variables: {
          form_trigger_application_id: applicationId,
          form_trigger_form_id: formId,
          form_trigger_user_id: userId,
          form_trigger_record: record,
        },
        customHeaders: {
          script: Buffer.from(
            `export default async function () { throw new Error('HELLO ERROR') }`
          ).toString('base64'),
        },
        complete,
        error,
      })
    ).resolves.toEqual(JOB_ACTION_ACKNOWLEDGEMENT)

    expect(error.mock.calls.at(0)).toMatchObject(['Error', 'HELLO ERROR'])

    expect(workflowLogService.create.mock.calls.at(0)?.at(0)).toMatchObject({
      userId,
      workflowId,
      type: 'error',
      content: expect.stringContaining('HELLO ERROR'),
    })
  })

  test('sandbox outputs', () => {
    const outputs = camundaWorkerService['sandboxOutputs']()
    expect(outputs).toMatchObject({})

    outputs['foo'] = '123'
    expect(outputs).toMatchObject({ foo: '123' })
  })

  test('sandbox formTrigger', () => {
    const record: Record = {
      id: new mongo.ObjectId().toHexString(),
      formId: new mongo.ObjectId().toHexString(),
      userId: new mongo.ObjectId().toHexString(),
      createdAt: Date.now(),
      data: {
        foo: {
          value: '123',
        },
      },
    }

    const trigger = camundaWorkerService['sandboxFormTrigger']({
      variables: {
        form_trigger_user_id: '123',
        form_trigger_form_id: '456',
        form_trigger_record: record,
      },
    })

    expect(trigger.userId).toEqual('123')
    expect(trigger.formId).toEqual('456')
    expect(trigger.record).toMatchObject(record)
  })

  test('sandbox application', async () => {
    const userId = new mongo.ObjectId().toHexString()
    const applicationId = new mongo.ObjectId().toHexString()

    const application = camundaWorkerService['sandboxApplication']({
      variables: { form_trigger_user_id: userId, form_trigger_application_id: applicationId },
    })

    expect(application.form_foo.id).toEqual('foo')
  })

  test('sandbox form', async () => {
    const userId = new mongo.ObjectId().toHexString()
    const applicationId = new mongo.ObjectId().toHexString()
    const formId = new mongo.ObjectId().toHexString()
    const form = camundaWorkerService['sandboxForm']({ userId, applicationId, formId })

    expect(form.id).toEqual(formId)
    expect(form.fields.foo.id).toEqual('foo')

    recordService.findOne.mockReturnValueOnce({ id: '123' })
    await expect(form.findOne({ recordId: '123' })).resolves.toMatchObject({ id: '123' })
    expect(recordService.findOne.mock.calls.at(0)?.at(0)).toMatchObject({ formId, recordId: '123' })

    recordService.create.mockReturnValueOnce({ id: '123', data: { foo: { value: 'bar' } } })
    await expect(form.create({ data: { foo: { value: 'bar' } } })).resolves.toMatchObject({
      id: '123',
      data: { foo: { value: 'bar' } },
    })
    expect(recordService.create.mock.calls.at(0)?.at(0)).toMatchObject({
      userId,
      formId,
      input: { data: { foo: { value: 'bar' } } },
    })

    recordService.update.mockReturnValueOnce({ id: '123', data: { foo: { value: 'baz' } } })
    await expect(
      form.update({ recordId: '123', data: { foo: { value: 'baz' } } })
    ).resolves.toMatchObject({ id: '123', data: { foo: { value: 'baz' } } })
    expect(recordService.update.mock.calls.at(0)?.at(0)).toMatchObject({
      userId,
      formId,
      recordId: '123',
      input: { data: { foo: { value: 'baz' } } },
    })

    recordService.delete.mockReturnValueOnce({ id: '123' })
    await expect(form.delete({ recordId: '123' })).resolves.toMatchObject({ id: '123' })
    expect(recordService.delete.mock.calls.at(0)?.at(0)).toMatchObject({
      userId,
      formId,
      recordId: '123',
    })
  })

  test('cacheScript', async () => {
    const js = `export default async function() { return 'HELLO'; }`

    const script = CamundaWorkerService['cacheScript']({
      elementId: '123',
      customHeaders: { script: Buffer.from(js).toString('base64') },
    })

    // test cache.
    expect(
      CamundaWorkerService['cacheScript']({
        elementId: '123',
        customHeaders: { script: Buffer.from(js).toString('base64') },
      })
    ).toStrictEqual(script)

    expect(script.code).toContain("return 'HELLO';")
    await expect(
      CamundaWorkerService['runDefaultExportedFunction'](new NodeVM(), script)
    ).resolves.toEqual('HELLO')
  })
})
