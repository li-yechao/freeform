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
import { Application } from '../schemas/application.schema'
import { ApplicationService } from './application.service'

describe('ApplicationService', () => {
  let applicationService: ApplicationService
  let applicationModel: MockType<Model<Application>>

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      providers: [
        ApplicationService,
        { provide: getModelToken(Application.name), useFactory: () => createMock() },
      ],
    }).compile()

    applicationService = moduleFixture.get(ApplicationService)
    applicationModel = moduleFixture.get(getModelToken(Application.name))
  })

  test('should return application', async () => {
    const applicationId = new mongo.ObjectId().toHexString()
    const userId = new mongo.ObjectId().toHexString()

    applicationModel.findOne.mockReturnValue({ id: applicationId, userId })

    await expect(applicationService.findOne({ userId, applicationId })).resolves.toEqual({
      id: applicationId,
      userId,
    })

    expect(applicationModel.findOne.mock.calls.at(0)?.at(0)).toMatchObject({
      _id: applicationId,
      userId,
      deletedAt: null,
    })
  })

  test('should throw error if application not found', async () => {
    const applicationId = new mongo.ObjectId().toHexString()

    applicationModel.findOne.mockReturnValue(undefined)

    await expect(applicationService.findOne({ applicationId })).rejects.toThrow(/not found/i)
  })

  test('should return application list', async () => {
    const userId = new mongo.ObjectId().toHexString()
    const applicationId = new mongo.ObjectId().toHexString()

    applicationModel.find.mockReturnValue([{ id: applicationId, userId }])

    await expect(applicationService.find({ userId })).resolves.toEqual([
      { id: applicationId, userId },
    ])

    expect(applicationModel.find.mock.calls.at(0)?.at(0)).toMatchObject({ userId, deletedAt: null })
  })

  test('should return application count', async () => {
    const userId = new mongo.ObjectId().toHexString()

    applicationModel.countDocuments.mockReturnValueOnce(10)

    await expect(applicationService.count({ userId })).resolves.toEqual(10)

    expect(applicationModel.countDocuments.mock.calls.at(0)?.at(0)).toMatchObject({
      userId,
      deletedAt: null,
    })
  })

  test('should return created application', async () => {
    const userId = new mongo.ObjectId().toHexString()
    const applicationId = new mongo.ObjectId().toHexString()

    applicationModel.create.mockReturnValue({ id: applicationId, userId })

    await expect(applicationService.create({ userId, input: {} })).resolves.toEqual({
      id: applicationId,
      userId,
    })

    expect(applicationModel.create.mock.calls.at(0)?.at(0)).toMatchObject({
      userId,
      createdAt: expect.any(Number),
    })
  })

  test('should return updated application', async () => {
    const userId = new mongo.ObjectId().toHexString()
    const applicationId = new mongo.ObjectId().toHexString()

    applicationModel.findOneAndUpdate.mockReturnValue({ id: applicationId, userId })

    await expect(applicationService.update({ userId, applicationId, input: {} })).resolves.toEqual({
      id: applicationId,
      userId,
    })

    expect(applicationModel.findOneAndUpdate.mock.calls.at(0)?.at(0)).toMatchObject({
      _id: applicationId,
      userId,
      deletedAt: null,
    })
    expect(applicationModel.findOneAndUpdate.mock.calls.at(0)?.at(1)).toMatchObject({
      $set: {
        updatedAt: expect.any(Number),
      },
    })
    expect(applicationModel.findOneAndUpdate.mock.calls.at(0)?.at(2)).toMatchObject({
      new: true,
    })
  })

  test('should throw not found error if updating application not exist', async () => {
    const userId = new mongo.ObjectId().toHexString()
    const applicationId = new mongo.ObjectId().toHexString()

    applicationModel.findOneAndUpdate.mockReturnValue(undefined)

    await expect(applicationService.update({ userId, applicationId, input: {} })).rejects.toThrow(
      /not found/i
    )
  })

  test('should return deleted application', async () => {
    const userId = new mongo.ObjectId().toHexString()
    const applicationId = new mongo.ObjectId().toHexString()

    applicationModel.findOneAndUpdate.mockReturnValue({ id: applicationId, userId })

    await expect(applicationService.delete({ userId, applicationId })).resolves.toEqual({
      id: applicationId,
      userId,
    })

    expect(applicationModel.findOneAndUpdate.mock.calls.at(0)?.at(0)).toMatchObject({
      _id: applicationId,
      userId,
      deletedAt: null,
    })
    expect(applicationModel.findOneAndUpdate.mock.calls.at(0)?.at(1)).toMatchObject({
      $set: {
        deletedAt: expect.any(Number),
      },
    })
    expect(applicationModel.findOneAndUpdate.mock.calls.at(0)?.at(2)).toMatchObject({
      new: true,
    })
  })

  test('should throw not found error if deleting application not exist', async () => {
    const userId = new mongo.ObjectId().toHexString()
    const applicationId = new mongo.ObjectId().toHexString()

    applicationModel.findOneAndUpdate.mockReturnValue(undefined)

    await expect(applicationService.delete({ userId, applicationId })).rejects.toThrow(/not found/i)
  })

  test('application script cache', async () => {
    const applicationId = new mongo.ObjectId().toHexString()

    applicationModel.findOne.mockReturnValue({
      id: applicationId,
      script: `\
export default class implements ApplicationScript {
}
      `,
    })

    await expect(applicationService['script']({ applicationId })).resolves.toBeTruthy()
    await expect(applicationService['script']({ applicationId })).resolves.toBeTruthy()
    expect(applicationModel.findOne.mock.calls.length).toBe(1)
  })

  test('should throw error if application script is null', async () => {
    const applicationId = new mongo.ObjectId().toHexString()

    applicationModel.findOne.mockReturnValue({
      id: applicationId,
      script: '',
    })

    await expect(applicationService['script']({ applicationId })).rejects.toThrow('script is null')
  })

  test('getDepartments', async () => {
    const applicationId = new mongo.ObjectId().toHexString()

    applicationModel.findOne.mockReturnValue({
      id: applicationId,
      script: `\
export default class implements ApplicationScript {
  async getDepartments({ departmentId, departmentIds }) {
    return [
      { id: '1', name: 'department 1' },
      { id: '2', name: 'department 2' },
    ]
  }
}
      `,
    })

    await expect(
      applicationService.getDepartments({ applicationId, departmentId: '', departmentIds: [] })
    ).resolves.toMatchObject([
      { id: '1', name: 'department 1', applicationId },
      { id: '2', name: 'department 2', applicationId },
    ])
  })

  test('getDepartment', async () => {
    const applicationId = new mongo.ObjectId().toHexString()

    applicationModel.findOne.mockReturnValue({
      id: applicationId,
      script: `\
export default class implements ApplicationScript {
  async getDepartment({ departmentId }) {
    return { id: '1', name: 'department 1' }
  }
}
      `,
    })

    await expect(
      applicationService.getDepartment({ applicationId, departmentId: '1' })
    ).resolves.toMatchObject({ id: '1', name: 'department 1', applicationId })
  })

  test('getUsers', async () => {
    const applicationId = new mongo.ObjectId().toHexString()

    applicationModel.findOne.mockReturnValue({
      id: applicationId,
      script: `\
export default class implements ApplicationScript {
  async getUsers({ departmentId, userIds }) {
    return [
      { id: '1', name: 'user 1', departmentId: '1' },
      { id: '2', name: 'user 2', departmentId: '1' },
    ]
  }
}
      `,
    })

    await expect(
      applicationService.getUsers({ applicationId, departmentId: '', userIds: [] })
    ).resolves.toMatchObject([
      { id: '1', name: 'user 1', departmentId: '1', applicationId },
      { id: '2', name: 'user 2', departmentId: '1', applicationId },
    ])
  })

  test('getUser', async () => {
    const applicationId = new mongo.ObjectId().toHexString()

    applicationModel.findOne.mockReturnValue({
      id: applicationId,
      script: `\
export default class implements ApplicationScript {
  async getUser({ userId }) {
    return { id: '1', name: 'user 1', departmentId: '1' }
  }
}
      `,
    })

    await expect(applicationService.getUser({ applicationId, userId: '1' })).resolves.toMatchObject(
      { id: '1', name: 'user 1', departmentId: '1', applicationId }
    )
  })
})
