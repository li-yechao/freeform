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
import { ZBClient } from 'zeebe-node'
import { createMock, MockType } from '../../jest.utils'
import { Workflow } from '../schemas/workflow.schema'
import { CamundaService } from './camunda.service'

describe('CamundaService', () => {
  let camundaService: CamundaService
  let zbClient: MockType<ZBClient>

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      providers: [CamundaService, { provide: ZBClient, useFactory: () => createMock() }],
    }).compile()

    camundaService = moduleFixture.get(CamundaService)
    zbClient = moduleFixture.get(ZBClient)
  })

  test('should call deployProcess', async () => {
    const workflow: Workflow = {
      id: new mongo.ObjectId().toHexString(),
      applicationId: new mongo.ObjectId().toHexString(),
      createdAt: Date.now(),
      trigger: {
        id: new mongo.ObjectId().toHexString(),
        type: 'form_trigger',
        formId: new mongo.ObjectId().toHexString(),
        actions: [{ type: 'create' }],
      },
      children: [
        {
          id: new mongo.ObjectId().toHexString(),
          type: 'script_js',
          script: '',
        },
      ],
    }

    zbClient.deployProcess.mockReturnValue({})

    await expect(
      camundaService.deployProcess({
        workflow,
      })
    ).resolves.toBeTruthy()

    expect(zbClient.deployProcess.mock.calls.at(0)?.at(0)).toMatchObject({
      name: workflow.id,
    })
  })

  test('should call createProcessInstance', async () => {
    const workflowId = new mongo.ObjectId().toHexString()

    zbClient.createProcessInstance.mockReturnValue({})

    await expect(
      camundaService.createProcessInstance({ workflowId, variables: { name: 'foo' } })
    ).resolves.toBeTruthy()

    expect(zbClient.createProcessInstance.mock.calls.at(0)).toMatchObject([
      `Process_${workflowId}`,
      { name: 'foo' },
    ])
  })
})
