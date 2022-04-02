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
import { WorkflowLog } from '../schemas/workflow-log.schema'
import { WorkflowLogService } from './workflow-log.service'

describe('WorkflowLogService', () => {
  let workflowLogService: WorkflowLogService
  let workflowLogModel: MockType<Model<WorkflowLog>>

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      providers: [
        WorkflowLogService,
        { provide: getModelToken(WorkflowLog.name), useFactory: () => createMock() },
      ],
    }).compile()

    workflowLogService = moduleFixture.get(WorkflowLogService)
    workflowLogModel = moduleFixture.get(getModelToken(WorkflowLog.name))
  })

  test('should return created log', async () => {
    const workflowLogId = new mongo.ObjectId().toHexString()
    const workflowId = new mongo.ObjectId().toHexString()
    const userId = new mongo.ObjectId().toHexString()

    workflowLogModel.create.mockReturnValue({
      id: workflowLogId,
      workflowId,
      userId,
      type: 'type',
      content: 'content',
    })

    await expect(
      workflowLogService.create({ userId, workflowId, type: 'type', content: 'content' })
    ).resolves.toMatchObject({
      id: workflowLogId,
      userId,
      workflowId,
      type: 'type',
      content: 'content',
    })

    expect(workflowLogModel.create.mock.calls.at(0)?.at(0)).toMatchObject({
      userId,
      workflowId,
      type: 'type',
      content: 'content',
    })
  })
})
