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
import { CreateApplicationInput, UpdateApplicationInput } from './application.input'
import { Application } from './application.schema'

@Injectable()
export class ApplicationService {
  constructor(
    @InjectModel(Application.name) private readonly applicationModel: Model<Application>
  ) {}

  async selectApplications(owner: string): Promise<Application[]> {
    return this.applicationModel.find({ owner, deletedAt: null })
  }

  async selectApplication(owner: string, appId: string): Promise<Application | null> {
    return this.applicationModel.findOne({ _id: appId, owner, deletedAt: null })
  }

  async createApplication(owner: string, input: CreateApplicationInput): Promise<Application> {
    return this.applicationModel.create({
      owner,
      name: input.name,
      createdAt: Date.now(),
    })
  }

  async updateApplication(
    owner: string,
    appId: string,
    input: UpdateApplicationInput
  ): Promise<Application | null> {
    return this.applicationModel.findOneAndUpdate(
      { _id: appId, owner, deletedAt: null },
      { $set: { name: input.name, updatedAt: Date.now() } },
      { new: true }
    )
  }

  async deleteApplication(owner: string, appId: string): Promise<Application | null> {
    return this.applicationModel.findOneAndUpdate(
      { _id: appId, owner, deletedAt: null },
      { $set: { deletedAt: Date.now() } },
      { new: true }
    )
  }
}
