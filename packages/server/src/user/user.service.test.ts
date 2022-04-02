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
import { createMock, MockType } from '../jest.utils'
import { User } from './user.schema'
import { UserService } from './user.service'

describe('UserService', () => {
  let userService: UserService
  let userModel: MockType<Model<User>>

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getModelToken(User.name), useFactory: () => createMock() },
      ],
    }).compile()

    userService = moduleFixture.get(UserService)
    userModel = moduleFixture.get(getModelToken(User.name))
  })

  test('should return user', async () => {
    const userId = new mongo.ObjectId().toHexString()

    userModel.findOne.mockReturnValueOnce({ id: userId })

    await expect(userService.findOne({ userId })).resolves.toMatchObject({ id: userId })

    expect(userModel.findOne.mock.calls.at(0)?.at(0)).toMatchObject({
      _id: userId,
      deletedAt: null,
    })
  })

  test('should throw not found error if user not exist', async () => {
    const userId = new mongo.ObjectId().toHexString()

    userModel.findOne.mockReturnValueOnce(undefined)

    await expect(userService.findOne({ userId })).rejects.toThrow(/not found/i)
  })

  test('should return user query by third', async () => {
    const userId = new mongo.ObjectId().toHexString()

    userModel.findOne.mockReturnValueOnce({ id: userId })

    await expect(
      userService.findOne({ thirdType: 'dingtalk', thirdId: '123' })
    ).resolves.toMatchObject({ id: userId })

    expect(userModel.findOne.mock.calls.at(0)?.at(0)).toMatchObject({
      [`third.dingtalk.__id`]: '123',
      deletedAt: null,
    })
  })

  test('should return created user', async () => {
    const userId = new mongo.ObjectId().toHexString()

    userModel.findOneAndUpdate.mockReturnValueOnce({ id: userId })

    await expect(
      userService.createOrUpdate({
        thirdType: 'dingtalk',
        thirdId: '123',
        thirdUser: { name: 'foo' },
      })
    ).resolves.toMatchObject({ id: userId })

    expect(userModel.findOneAndUpdate.mock.calls.at(0)).toMatchObject([
      { [`third.dingtalk.__id`]: '123', deletedAt: null },
      {
        $set: { updatedAt: expect.any(Number), [`third.dingtalk`]: { name: 'foo' } },
        $setOnInsert: { createdAt: expect.any(Number) },
      },
      { upsert: true, new: true },
    ])
  })
})
