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

import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { User } from './user.schema'

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

  async findOne({ userId }: { userId: string }): Promise<User> {
    const user = await this.userModel.findById(userId)
    if (!user) {
      throw new Error(`User ${userId} not found`)
    }
    return user
  }

  async findOptionalByThirdId({
    type,
    thirdId,
  }: {
    type: string
    thirdId: string
  }): Promise<User | null> {
    return this.userModel.findOne({ [`third.${type}.__id`]: thirdId })
  }

  async findOneByThirdId({ type, thirdId }: { type: string; thirdId: string }): Promise<User> {
    const user = await this.findOptionalByThirdId({ type, thirdId })
    if (!user) {
      throw new Error(`Third user ${thirdId} not found`)
    }
    return user
  }

  async createWithThirdUser({
    type,
    thirdId,
    thirdUser,
  }: {
    type: string
    thirdId: string
    thirdUser: { [key: string]: any }
  }): Promise<User> {
    return this.userModel.create({
      createdAt: Date.now(),
      third: {
        [type]: {
          __id: thirdId,
          ...thirdUser,
        },
      },
    })
  }
}
