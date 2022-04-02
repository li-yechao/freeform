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
import { CreateRecordInput, UpdateRecordInput } from '../inputs/record.input'
import { Record } from '../schemas/record.schema'
import { CamundaService } from './camunda.service'
import { FormService } from './form.service'
import { WorkflowService } from './workflow.service'

@Injectable()
export class RecordService {
  constructor(
    @InjectModel(Record.name) private readonly recordModel: Model<Record>,
    private readonly formService: FormService,
    private readonly workflowService: WorkflowService,
    private readonly camundaService: CamundaService
  ) {}

  async findOne({ formId, recordId }: { formId?: string; recordId: string }): Promise<Record> {
    const record = await this.recordModel.findOne({
      _id: recordId,
      formId,
      deletedAt: null,
    })
    if (!record) {
      throw new Error(`Record ${recordId} not found`)
    }
    return record
  }

  async find({
    formId,
    filter,
    offset,
    limit,
    sort,
  }: {
    formId: string
    filter?: FilterQuery<Record>
    offset?: number
    limit?: number
    sort?: { [key in keyof Record]?: 1 | -1 }
  }): Promise<Record[]> {
    return this.recordModel.find({ formId, deletedAt: null, ...filter }, undefined, {
      sort,
      skip: offset,
      limit,
    })
  }

  async count({
    formId,
    filter,
  }: {
    formId: string
    filter?: FilterQuery<Record>
  }): Promise<number> {
    return this.recordModel.countDocuments({ formId, deletedAt: null, ...filter })
  }

  async create({
    userId,
    formId,
    input,
    startWorkflowInstance = false,
  }: {
    userId: string
    formId: string
    input: CreateRecordInput
    startWorkflowInstance?: boolean
  }): Promise<Record> {
    const record = await this.recordModel.create({
      userId,
      formId,
      createdAt: Date.now(),
      data: input.data,
    })

    if (startWorkflowInstance) {
      this.createProcessInstance({ userId, formId, action: 'create', record })
    }

    return record
  }

  async update({
    userId,
    formId,
    recordId,
    input,
    startWorkflowInstance = false,
  }: {
    userId: string
    formId: string
    recordId: string
    input: UpdateRecordInput
    startWorkflowInstance?: boolean
  }): Promise<Record> {
    const update = Object.entries(input.data ?? {}).reduce(
      (res, [key, value]) => Object.assign(res, { [`data.${key}`]: value }),
      {}
    )

    const record = await this.recordModel.findOneAndUpdate(
      { _id: recordId, formId, deletedAt: null },
      { $set: { updatedAt: Date.now(), ...update } },
      { new: true }
    )

    if (!record) {
      throw new Error(`Record ${recordId} not found`)
    }

    if (startWorkflowInstance) {
      this.createProcessInstance({ userId, formId, action: 'update', record })
    }

    return record
  }

  async delete({
    userId,
    formId,
    recordId,
    startWorkflowInstance = false,
  }: {
    userId: string
    formId: string
    recordId: string
    startWorkflowInstance?: boolean
  }): Promise<Record> {
    const record = await this.recordModel.findOneAndUpdate(
      { _id: recordId, formId, deletedAt: null },
      { $set: { deletedAt: Date.now() } },
      { new: true }
    )

    if (!record) {
      throw new Error(`Record ${recordId} not found`)
    }

    if (startWorkflowInstance) {
      this.createProcessInstance({ userId, formId, action: 'delete', record })
    }

    return record
  }

  private async createProcessInstance({
    userId,
    formId,
    action,
    record,
  }: {
    userId: string
    formId: string
    action: 'create' | 'update' | 'delete'
    record: Record
  }) {
    const { applicationId } = await this.formService.findOne({ formId })

    const workflows = await this.workflowService.find({
      applicationId,
      filter: {
        'trigger.type': 'form_trigger',
        'trigger.formId': formId,
        'trigger.actions.type': action,
      },
    })
    for (const workflow of workflows) {
      this.camundaService?.createProcessInstance({
        workflowId: workflow.id,
        variables: {
          form_trigger_user_id: userId,
          form_trigger_application_id: applicationId,
          form_trigger_form_id: formId,
          form_trigger_record: record,
        },
      })
    }
  }
}
