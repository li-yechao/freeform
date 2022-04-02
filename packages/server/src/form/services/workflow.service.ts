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
import { FilterQuery, Model } from 'mongoose'
import { CreateWorkflowInput, UpdateWorkflowInput } from '../inputs/workflow.input'
import { Workflow } from '../schemas/workflow.schema'
import { CamundaService } from './camunda.service'

@Injectable()
export class WorkflowService {
  constructor(
    @InjectModel(Workflow.name) private readonly workflowModel: Model<Workflow>,
    private readonly camundaService?: CamundaService
  ) {}

  async findOne({
    applicationId,
    workflowId,
  }: {
    applicationId?: string
    workflowId: string
  }): Promise<Workflow> {
    const workflow = await this.workflowModel.findOne({
      _id: workflowId,
      applicationId,
      deletedAt: null,
    })
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`)
    }
    return workflow
  }

  async find({
    applicationId,
    filter,
    sort,
    offset,
    limit,
  }: {
    applicationId: string
    filter?: FilterQuery<Workflow>
    sort?: { [key in keyof Workflow]?: 1 | -1 }
    offset?: number
    limit?: number
  }): Promise<Workflow[]> {
    return this.workflowModel.find({ applicationId, deletedAt: null, ...filter }, null, {
      sort,
      skip: offset,
      limit,
    })
  }

  async count({
    applicationId,
    filter,
  }: {
    applicationId: string
    filter?: FilterQuery<Workflow>
  }): Promise<number> {
    return this.workflowModel.countDocuments({ applicationId, deletedAt: null, ...filter })
  }

  async create({
    applicationId,
    input,
  }: {
    applicationId: string
    input: CreateWorkflowInput
  }): Promise<Workflow> {
    const workflow = await this.workflowModel.create({
      applicationId,
      createdAt: Date.now(),
      ...input,
    })

    await this.camundaService?.deployProcess({ workflow })

    return workflow
  }

  async update({
    applicationId,
    workflowId,
    input,
  }: {
    applicationId?: string
    workflowId: string
    input: UpdateWorkflowInput
  }): Promise<Workflow> {
    const workflow = await this.workflowModel.findOneAndUpdate(
      { _id: workflowId, applicationId, deletedAt: null },
      {
        $set: {
          updatedAt: Date.now(),
          ...input,
        },
      },
      { new: true }
    )

    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`)
    }

    await this.camundaService?.deployProcess({ workflow })

    return workflow
  }

  async delete({
    applicationId,
    workflowId,
  }: {
    applicationId?: string
    workflowId: string
  }): Promise<Workflow> {
    const workflow = await this.workflowModel.findOneAndUpdate(
      { _id: workflowId, applicationId, deletedAt: null },
      { $set: { deletedAt: Date.now() } },
      { new: true }
    )

    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`)
    }
    return workflow
  }
}
