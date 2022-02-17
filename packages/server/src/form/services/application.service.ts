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

@Injectable()
export class ApplicationService {
  constructor(
    @InjectModel(Application.name) private readonly applicationModel: Model<Application>
  ) {}

  async selectApplications(userId: string): Promise<Application[]> {
    return this.applicationModel.find({ userId, deletedAt: null })
  }

  async selectApplication(userId: string, applicationId: string): Promise<Application | null> {
    return this.applicationModel.findOne({ _id: applicationId, userId, deletedAt: null })
  }

  async createApplication(userId: string, input: CreateApplicationInput): Promise<Application> {
    return this.applicationModel.create({
      userId,
      name: input.name,
      createdAt: Date.now(),
    })
  }

  async updateApplication(
    userId: string,
    applicationId: string,
    input: UpdateApplicationInput
  ): Promise<Application | null> {
    return this.applicationModel.findOneAndUpdate(
      { _id: applicationId, userId, deletedAt: null },
      { $set: { name: input.name, updatedAt: Date.now() } },
      { new: true }
    )
  }

  async deleteApplication(userId: string, applicationId: string): Promise<Application | null> {
    return this.applicationModel.findOneAndUpdate(
      { _id: applicationId, userId, deletedAt: null },
      { $set: { deletedAt: Date.now() } },
      { new: true }
    )
  }
}
