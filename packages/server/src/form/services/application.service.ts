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
import { CreateApplicationInput, UpdateApplicationInput } from '../inputs/application.input'
import { Application } from '../schemas/application.schema'
import { ThirdUserService } from './third-user.service'

@Injectable()
export class ApplicationService {
  constructor(
    @InjectModel(Application.name) private readonly applicationModel: Model<Application>,
    private readonly thirdUserService: ThirdUserService
  ) {}

  async findOne({ applicationId }: { applicationId: string }): Promise<Application> {
    const application = await this.applicationModel.findOne({ _id: applicationId, deletedAt: null })
    if (!application) {
      throw new Error(`Application ${applicationId} not found`)
    }
    return application
  }

  async findAllByUserId({ userId }: { userId: string }): Promise<Application[]> {
    return this.applicationModel.find({ userId, deletedAt: null })
  }

  async create(
    { userId }: { userId: string },
    input: CreateApplicationInput
  ): Promise<Application> {
    return this.applicationModel.create({
      userId,
      createdAt: Date.now(),
      ...input,
    })
  }

  async update(
    { applicationId }: { applicationId: string },
    input: UpdateApplicationInput
  ): Promise<Application> {
    const application = await this.applicationModel.findOneAndUpdate(
      { _id: applicationId, deletedAt: null },
      {
        $set: {
          updatedAt: Date.now(),
          ...input,
        },
      },
      { new: true }
    )

    if (!application) {
      throw new Error(`Application ${applicationId} not foundd`)
    }

    if (typeof input.thirdScript === 'string') {
      this.thirdUserService.markModuleChanged(applicationId)
    }
    return application
  }

  async delete({ applicationId }: { applicationId: string }): Promise<Application> {
    const application = await this.applicationModel.findOneAndUpdate(
      { _id: applicationId, deletedAt: null },
      { $set: { deletedAt: Date.now() } },
      { new: true }
    )

    if (!application) {
      throw new Error(`Application ${applicationId} not foundd`)
    }
    return application
  }
}
