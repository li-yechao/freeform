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

import { getModelToken } from '@nestjs/mongoose'
import { Test } from '@nestjs/testing'
import { Model, mongo } from 'mongoose'
import { createMock, MockType } from '../../jest.utils'
import { Record } from '../schemas/record.schema'
import { CamundaService } from './camunda.service'
import { FormService } from './form.service'
import { RecordService } from './record.service'
import { WorkflowService } from './workflow.service'

describe('RecordService', () => {
  let recordService: RecordService
  let recordModel: MockType<Model<Record>>
  let workflowService: MockType<WorkflowService>
  let formService: MockType<FormService>
  let camundaService: MockType<CamundaService>

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      providers: [
        RecordService,
        { provide: getModelToken(Record.name), useFactory: () => createMock() },
        { provide: FormService, useFactory: () => createMock() },
        { provide: WorkflowService, useFactory: () => createMock() },
        { provide: CamundaService, useFactory: () => createMock() },
      ],
    }).compile()

    recordService = moduleFixture.get(RecordService)
    recordModel = moduleFixture.get(getModelToken(Record.name))
    workflowService = moduleFixture.get(WorkflowService)
    formService = moduleFixture.get(FormService)
    camundaService = moduleFixture.get(CamundaService)
  })

  test('should return record', async () => {
    const formId = new mongo.ObjectId().toHexString()
    const recordId = new mongo.ObjectId().toHexString()

    recordModel.findOne.mockReturnValue({ id: recordId, formId })

    await expect(recordService.findOne({ formId, recordId })).resolves.toMatchObject({
      id: recordId,
      formId,
    })

    expect(recordModel.findOne.mock.calls.at(0)?.at(0)).toMatchObject({
      _id: recordId,
      formId,
      deletedAt: null,
    })
  })

  test('should throw not found error if record not exist', async () => {
    const formId = new mongo.ObjectId().toHexString()
    const recordId = new mongo.ObjectId().toHexString()

    recordModel.findOne.mockReturnValue(undefined)

    await expect(recordService.findOne({ formId, recordId })).rejects.toThrow(/not found/i)
  })

  test('should return record list', async () => {
    const formId = new mongo.ObjectId().toHexString()
    const recordId = new mongo.ObjectId().toHexString()

    recordModel.find.mockReturnValue([{ id: recordId, formId }])

    await expect(recordService.find({ formId })).resolves.toMatchObject([
      {
        id: recordId,
        formId,
      },
    ])

    expect(recordModel.find.mock.calls.at(0)?.at(0)).toMatchObject({
      formId,
      deletedAt: null,
    })
  })

  test('should return record count', async () => {
    const formId = new mongo.ObjectId().toHexString()

    recordModel.countDocuments.mockReturnValue(10)

    await expect(recordService.count({ formId })).resolves.toEqual(10)

    expect(recordModel.countDocuments.mock.calls.at(0)?.at(0)).toMatchObject({
      formId,
      deletedAt: null,
    })
  })

  test('should return created record', async () => {
    const applicationId = new mongo.ObjectId().toHexString()
    const userId = new mongo.ObjectId().toHexString()
    const formId = new mongo.ObjectId().toHexString()
    const recordId = new mongo.ObjectId().toHexString()

    recordModel.create.mockReturnValue({ id: recordId, formId, userId, data: {} })

    // used in startProcessInstance.
    formService.findOne.mockReturnValue({
      id: formId,
      applicationId,
    })
    workflowService.find.mockReturnValue([])

    await expect(
      recordService.create({ userId, formId, input: { data: {} }, startWorkflowInstance: true })
    ).resolves.toMatchObject({
      id: recordId,
      formId,
      userId,
      data: {},
    })

    expect(recordModel.create.mock.calls.at(0)?.at(0)).toMatchObject({
      userId,
      formId,
      createdAt: expect.any(Number),
      data: {},
    })

    expect(workflowService.find.mock.calls.at(0)?.at(0)).toMatchObject({
      applicationId,
      filter: {
        'trigger.type': 'form_trigger',
        'trigger.formId': formId,
        'trigger.actions.type': 'create',
      },
    })
  })

  test('should return updated record', async () => {
    const applicationId = new mongo.ObjectId().toHexString()
    const userId = new mongo.ObjectId().toHexString()
    const formId = new mongo.ObjectId().toHexString()
    const recordId = new mongo.ObjectId().toHexString()

    recordModel.findOneAndUpdate.mockReturnValue({ id: recordId, formId, userId, data: {} })

    // used in startProcessInstance.
    formService.findOne.mockReturnValue({
      id: formId,
      applicationId,
    })
    workflowService.find.mockReturnValue([])

    await expect(
      recordService.update({
        userId,
        formId,
        recordId,
        input: {
          data: {
            name: { value: 'foo' },
            age: { value: 10 },
          },
        },
        startWorkflowInstance: true,
      })
    ).resolves.toMatchObject({
      id: recordId,
      formId,
      userId,
      data: {},
    })

    expect(recordModel.findOneAndUpdate.mock.calls.at(0)?.at(0)).toMatchObject({
      _id: recordId,
      formId,
      deletedAt: null,
    })
    expect(recordModel.findOneAndUpdate.mock.calls.at(0)?.at(1)).toMatchObject({
      $set: {
        updatedAt: expect.any(Number),
        'data.name': { value: 'foo' },
        'data.age': { value: 10 },
      },
    })
    expect(recordModel.findOneAndUpdate.mock.calls.at(0)?.at(2)).toMatchObject({ new: true })
    expect(workflowService.find.mock.calls.at(0)?.at(0)).toMatchObject({
      applicationId,
      filter: {
        'trigger.type': 'form_trigger',
        'trigger.formId': formId,
        'trigger.actions.type': 'update',
      },
    })
  })

  test('should throw not found error if updating record not exist', async () => {
    const userId = new mongo.ObjectId().toHexString()
    const formId = new mongo.ObjectId().toHexString()
    const recordId = new mongo.ObjectId().toHexString()

    recordModel.findOneAndUpdate.mockReturnValue(undefined)

    await expect(recordService.update({ userId, formId, recordId, input: {} })).rejects.toThrow(
      /not found/i
    )
  })

  test('should return deleted record', async () => {
    const applicationId = new mongo.ObjectId().toHexString()
    const userId = new mongo.ObjectId().toHexString()
    const formId = new mongo.ObjectId().toHexString()
    const recordId = new mongo.ObjectId().toHexString()

    recordModel.findOneAndUpdate.mockReturnValue({
      id: recordId,
      formId,
      deletedAt: Date.now(),
    })

    // used in startProcessInstance.
    formService.findOne.mockReturnValue({
      id: formId,
      applicationId,
    })
    workflowService.find.mockReturnValue([])

    await expect(
      recordService.delete({ userId, formId, recordId, startWorkflowInstance: true })
    ).resolves.toMatchObject({
      id: recordId,
      formId,
      deletedAt: expect.any(Number),
    })

    expect(recordModel.findOneAndUpdate.mock.calls.at(0)?.at(0)).toMatchObject({
      _id: recordId,
      formId,
      deletedAt: null,
    })
    expect(recordModel.findOneAndUpdate.mock.calls.at(0)?.at(1)).toMatchObject({
      $set: { deletedAt: expect.any(Number) },
    })
    expect(recordModel.findOneAndUpdate.mock.calls.at(0)?.at(2)).toMatchObject({
      new: true,
    })
    expect(workflowService.find.mock.calls.at(0)?.at(0)).toMatchObject({
      applicationId,
      filter: {
        'trigger.type': 'form_trigger',
        'trigger.formId': formId,
        'trigger.actions.type': 'delete',
      },
    })
  })

  test('should throw not found error if deleting record not exist', async () => {
    const userId = new mongo.ObjectId().toHexString()
    const formId = new mongo.ObjectId().toHexString()
    const recordId = new mongo.ObjectId().toHexString()

    recordModel.findOneAndUpdate.mockReturnValue(undefined)

    await expect(recordService.delete({ userId, formId, recordId })).rejects.toThrow(/not found/i)
  })

  test('should call camundaService.createProcessInstance', async () => {
    const applicationId = new mongo.ObjectId().toHexString()
    const userId = new mongo.ObjectId().toHexString()
    const formId = new mongo.ObjectId().toHexString()
    const record = {
      id: new mongo.ObjectId().toHexString(),
      formId,
    } as any as Record
    const workflows = [
      { id: new mongo.ObjectId().toHexString() },
      { id: new mongo.ObjectId().toHexString() },
    ]

    formService.findOne.mockReturnValue({
      id: formId,
      applicationId,
    })
    workflowService.find.mockReturnValue(workflows)

    await expect(
      recordService['createProcessInstance']({ userId, formId, record, action: 'create' })
    ).resolves.toBeUndefined()

    expect(workflowService.find.mock.calls.at(0)?.at(0)).toMatchObject({
      applicationId,
      filter: {
        'trigger.type': 'form_trigger',
        'trigger.formId': formId,
        'trigger.actions.type': 'create',
      },
    })
    expect(camundaService.createProcessInstance.mock.calls).toMatchObject([
      [
        {
          workflowId: workflows[0]?.id,
          variables: {
            form_trigger_user_id: userId,
            form_trigger_application_id: applicationId,
            form_trigger_form_id: formId,
            form_trigger_record: record,
          },
        },
      ],
      [
        {
          workflowId: workflows[1]?.id,
          variables: {
            form_trigger_user_id: userId,
            form_trigger_application_id: applicationId,
            form_trigger_form_id: formId,
            form_trigger_record: record,
          },
        },
      ],
    ])
  })
})
