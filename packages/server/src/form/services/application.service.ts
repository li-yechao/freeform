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
import fetch from 'cross-fetch'
import { FilterQuery, Model } from 'mongoose'
import { ModuleKind, ScriptTarget, transpileModule } from 'typescript'
import { NodeVM } from 'vm2'
import { CreateApplicationInput, UpdateApplicationInput } from '../inputs/application.input'
import { Application, ApplicationDepartment, ApplicationUser } from '../schemas/application.schema'

export interface ApplicationScript {
  getDepartments(query?: {
    departmentId?: string
    departmentIds?: string[]
  }): Promise<Omit<ApplicationDepartment, 'applicationId'>[]>

  getDepartment(query: {
    departmentId: string
  }): Promise<Omit<ApplicationDepartment, 'applicationId'>>

  getUsers(query: {
    departmentId?: string
    userIds?: string[]
  }): Promise<Omit<ApplicationUser, 'applicationId'>[]>

  getUser(query: { userId: string }): Promise<Omit<ApplicationUser, 'applicationId'>>
}

@Injectable()
export class ApplicationService {
  constructor(
    @InjectModel(Application.name) private readonly applicationModel: Model<Application>
  ) {}

  async findOne({
    userId,
    applicationId,
  }: {
    userId?: string
    applicationId: string
  }): Promise<Application> {
    const application = await this.applicationModel.findOne({
      _id: applicationId,
      userId,
      deletedAt: null,
    })
    if (!application) {
      throw new Error(`Application ${applicationId} not found`)
    }
    return application
  }

  async find({
    userId,
    filter,
    sort,
    offset,
    limit,
  }: {
    userId: string
    filter?: FilterQuery<Application>
    sort?: { [key in keyof Application]?: 1 | -1 }
    offset?: number
    limit?: number
  }): Promise<Application[]> {
    return this.applicationModel.find({ userId, deletedAt: null, ...filter }, null, {
      sort,
      skip: offset,
      limit,
    })
  }

  async count({
    userId,
    filter,
  }: {
    userId: string
    filter?: FilterQuery<Application>
  }): Promise<number> {
    return this.applicationModel.countDocuments({ userId, deletedAt: null, ...filter })
  }

  async create({
    userId,
    input,
  }: {
    userId: string
    input: CreateApplicationInput
  }): Promise<Application> {
    return this.applicationModel.create({
      userId,
      createdAt: Date.now(),
      ...input,
    })
  }

  async update({
    userId,
    applicationId,
    input,
  }: {
    userId?: string
    applicationId: string
    input: UpdateApplicationInput
  }): Promise<Application> {
    const application = await this.applicationModel.findOneAndUpdate(
      { _id: applicationId, userId, deletedAt: null },
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

    return application
  }

  async delete({
    userId,
    applicationId,
  }: {
    userId?: string
    applicationId: string
  }): Promise<Application> {
    const application = await this.applicationModel.findOneAndUpdate(
      { _id: applicationId, userId, deletedAt: null },
      { $set: { deletedAt: Date.now() } },
      { new: true }
    )

    if (!application) {
      throw new Error(`Application ${applicationId} not foundd`)
    }

    return application
  }

  async getDepartments({
    applicationId,
    departmentId,
    departmentIds,
  }: {
    applicationId: string
    departmentId?: string
    departmentIds?: string[]
  }): Promise<ApplicationDepartment[]> {
    const script = await this.script({ applicationId })
    return (await script.getDepartments({ departmentId, departmentIds })).map(dep => ({
      applicationId,
      ...dep,
    }))
  }

  async getDepartment({
    applicationId,
    departmentId,
  }: {
    applicationId: string
    departmentId: string
  }): Promise<ApplicationDepartment> {
    const script = await this.script({ applicationId })
    return {
      applicationId,
      ...(await script.getDepartment({ departmentId })),
    }
  }

  async getUsers({
    applicationId,
    departmentId,
    userIds,
  }: {
    applicationId: string
    departmentId?: string
    userIds?: string[]
  }): Promise<ApplicationUser[]> {
    const script = await this.script({ applicationId })
    return (await script.getUsers({ departmentId, userIds })).map(user => ({
      applicationId,
      ...user,
    }))
  }

  async getUser({
    applicationId,
    userId,
  }: {
    applicationId: string
    userId: string
  }): Promise<ApplicationUser> {
    const script = await this.script({ applicationId })
    return {
      applicationId,
      ...(await script.getUser({ userId })),
    }
  }

  private static scriptCache = new Map<string, Promise<ApplicationScript>>()

  private async script({ applicationId }: { applicationId: string }) {
    let m = ApplicationService.scriptCache.get(applicationId)
    if (!m) {
      m = (async () => {
        const script = (await this.findOne({ applicationId })).script

        if (!script) {
          throw new Error(`Application script is null`)
        }

        const vm = new NodeVM({
          sandbox: { fetch },
        })

        const M = vm.run(
          transpileModule(script, {
            compilerOptions: {
              module: ModuleKind.CommonJS,
              target: ScriptTarget.ES2021,
            },
          }).outputText
        ).default

        return new M()
      })()

      ApplicationService.scriptCache.set(applicationId, m)
    }
    return m
  }
}
