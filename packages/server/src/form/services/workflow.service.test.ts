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
import { Workflow } from '../schemas/workflow.schema'
import { CamundaService } from './camunda.service'
import { WorkflowService } from './workflow.service'

describe('WorkflowService', () => {
  let workflowService: WorkflowService
  let workflowModel: MockType<Model<Workflow>>
  let camundaService: MockType<CamundaService>

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      providers: [
        WorkflowService,
        { provide: getModelToken(Workflow.name), useFactory: () => createMock() },
        { provide: CamundaService, useFactory: () => createMock() },
      ],
    }).compile()

    workflowService = moduleFixture.get(WorkflowService)
    workflowModel = moduleFixture.get(getModelToken(Workflow.name))
    camundaService = moduleFixture.get(CamundaService)
  })

  test('should return workflow', async () => {
    const applicationId = new mongo.ObjectId().toHexString()
    const workflowId = new mongo.ObjectId().toHexString()

    workflowModel.findOne.mockReturnValue({ id: workflowId, applicationId })

    await expect(workflowService.findOne({ applicationId, workflowId })).resolves.toMatchObject({
      id: workflowId,
      applicationId,
    })

    expect(workflowModel.findOne.mock.calls.at(0)?.at(0)).toMatchObject({
      _id: workflowId,
      applicationId,
      deletedAt: null,
    })
  })

  test('should throw not found error if workflow not exist', async () => {
    const applicationId = new mongo.ObjectId().toHexString()
    const workflowId = new mongo.ObjectId().toHexString()

    workflowModel.findOne.mockReturnValue(undefined)

    await expect(workflowService.findOne({ applicationId, workflowId })).rejects.toThrow(
      /not found/i
    )
  })

  test('should return workflow list', async () => {
    const applicationId = new mongo.ObjectId().toHexString()
    const workflowId = new mongo.ObjectId().toHexString()

    workflowModel.find.mockReturnValue([{ id: workflowId, applicationId }])

    await expect(workflowService.find({ applicationId })).resolves.toMatchObject([
      {
        id: workflowId,
        applicationId,
      },
    ])

    expect(workflowModel.find.mock.calls.at(0)?.at(0)).toMatchObject({
      applicationId,
      deletedAt: null,
    })
  })

  test('should return workflow count', async () => {})

  test('should return created workflow', async () => {
    const applicationId = new mongo.ObjectId().toHexString()
    const workflowId = new mongo.ObjectId().toHexString()

    workflowModel.create.mockReturnValue({ id: workflowId, applicationId })

    await expect(workflowService.create({ applicationId, input: {} })).resolves.toMatchObject({
      id: workflowId,
      applicationId,
    })

    expect(camundaService.deployProcess.mock.calls.at(0)?.at(0)).toMatchObject({
      workflow: {
        id: workflowId,
        applicationId,
      },
    })

    expect(workflowModel.create.mock.calls.at(0)?.at(0)).toMatchObject({
      applicationId,
      createdAt: expect.any(Number),
    })
  })

  test('should return updated workflow', async () => {
    const applicationId = new mongo.ObjectId().toHexString()
    const workflowId = new mongo.ObjectId().toHexString()

    workflowModel.findOneAndUpdate.mockReturnValue({ id: workflowId, applicationId })

    await expect(
      workflowService.update({ applicationId, workflowId, input: {} })
    ).resolves.toMatchObject({
      id: workflowId,
      applicationId,
    })

    expect(workflowModel.findOneAndUpdate.mock.calls.at(0)?.at(0)).toMatchObject({
      _id: workflowId,
      applicationId,
      deletedAt: null,
    })
    expect(workflowModel.findOneAndUpdate.mock.calls.at(0)?.at(1)).toMatchObject({
      $set: { updatedAt: expect.any(Number) },
    })
    expect(workflowModel.findOneAndUpdate.mock.calls.at(0)?.at(2)).toMatchObject({
      new: true,
    })

    expect(camundaService.deployProcess.mock.calls.at(0)?.at(0)).toMatchObject({
      workflow: {
        id: workflowId,
        applicationId,
      },
    })
  })

  test('should throw not found error if updating workflow not exist', async () => {
    const applicationId = new mongo.ObjectId().toHexString()
    const workflowId = new mongo.ObjectId().toHexString()

    workflowModel.findOneAndUpdate.mockReturnValue(undefined)

    await expect(workflowService.update({ applicationId, workflowId, input: {} })).rejects.toThrow(
      /not found/i
    )
  })

  test('should return deleted workflow', async () => {
    const applicationId = new mongo.ObjectId().toHexString()
    const workflowId = new mongo.ObjectId().toHexString()

    workflowModel.findOneAndUpdate.mockReturnValue({ id: workflowId, applicationId })

    await expect(workflowService.delete({ applicationId, workflowId })).resolves.toMatchObject({
      id: workflowId,
      applicationId,
    })

    expect(workflowModel.findOneAndUpdate.mock.calls.at(0)?.at(0)).toMatchObject({
      _id: workflowId,
      applicationId,
      deletedAt: null,
    })
    expect(workflowModel.findOneAndUpdate.mock.calls.at(0)?.at(1)).toMatchObject({
      $set: { deletedAt: expect.any(Number) },
    })
    expect(workflowModel.findOneAndUpdate.mock.calls.at(0)?.at(2)).toMatchObject({
      new: true,
    })
  })

  test('should throw not found error if deleting workflow not exist', async () => {
    const applicationId = new mongo.ObjectId().toHexString()
    const workflowId = new mongo.ObjectId().toHexString()

    workflowModel.findOneAndUpdate.mockReturnValue(undefined)

    await expect(workflowService.delete({ applicationId, workflowId })).rejects.toThrow(
      /not found/i
    )
  })
})
