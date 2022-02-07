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
import { FormService } from '../form/form.service'
import { WorkflowService } from '../workflow/workflow.service'
import { CreateRecordInput, UpdateRecordInput } from './record.input'
import { Record } from './record.schema'

@Injectable()
export class RecordService {
  constructor(
    @InjectModel(Record.name) private readonly recordModel: Model<Record>,
    private readonly formService: FormService,
    private readonly workflowService: WorkflowService
  ) {}

  async selectRecord(
    viewerId: string,
    appId: string,
    formId: string,
    viewId: string,
    recordId: string
  ): Promise<Record | null> {
    const form = await this.formService.selectForm(viewerId, appId, formId)
    if (!form) {
      throw new Error(`Form ${formId} not found`)
    }
    const view = form.views?.find(i => i.id === viewId)
    if (!view) {
      throw new Error(`View ${viewId} not found`)
    }

    const record = await this.recordModel.findOne({ _id: recordId, form: formId, deletedAt: null })

    // TODO: remove fields that not exists in the view

    return record
  }

  async selectRecords(
    viewerId: string,
    appId: string,
    formId: string,
    viewId: string,
    page: number,
    limit: number
  ): Promise<Record[]> {
    const form = await this.formService.selectForm(viewerId, appId, formId)
    if (!form) {
      throw new Error(`Form ${formId} not found`)
    }
    const view = form.views?.find(i => i.id === viewId)
    if (!view) {
      throw new Error(`View ${viewId} not found`)
    }

    const records = await this.recordModel
      .find({ form: formId, deletedAt: null })
      .sort({ _id: -1 })
      .skip(page * limit)
      .limit(limit)

    // TODO: remove fields that not exists in the view

    return records
  }

  async selectRecordCount(
    viewerId: string,
    appId: string,
    formId: string,
    viewId: string
  ): Promise<number> {
    const form = await this.formService.selectForm(viewerId, appId, formId)
    if (!form) {
      throw new Error(`Form ${formId} not found`)
    }
    const view = form.views?.find(i => i.id === viewId)
    if (!view) {
      throw new Error(`View ${viewId} not found`)
    }

    return this.recordModel.countDocuments({ form: formId, deletedAt: null })
  }

  async createRecord(
    viewerId: string,
    appId: string,
    formId: string,
    input: CreateRecordInput
  ): Promise<Record> {
    const form = await this.formService.selectForm(viewerId, appId, formId)
    if (!form) {
      throw new Error(`Form ${formId} not found`)
    }

    // TODO: verify input data schema
    const data: Record['data'] = input.data

    const record = await this.recordModel.create({
      owner: viewerId,
      form: formId,
      createdAt: Date.now(),
      data,
    })

    this.postCreateEvent(appId, formId, record)

    return record
  }

  async updateRecord(
    viewerId: string,
    appId: string,
    formId: string,
    recordId: string,
    input: UpdateRecordInput
  ): Promise<Record | null> {
    const form = await this.formService.selectForm(viewerId, appId, formId)
    if (!form) {
      throw new Error(`Form ${formId} not found`)
    }

    // TODO: verify input data schema
    const data = Object.entries(input.data ?? {}).reduce<{
      [key: `data.${string}`]: { value: any }
    }>((res, [key, val]) => Object.assign(res, { [`data.${key}`]: val }), {})

    return this.recordModel.findOneAndUpdate(
      { _id: recordId, form: formId, deletedAt: null },
      {
        $set: {
          updatedAt: Date.now(),
          ...data,
        },
      },
      { new: true }
    )
  }

  async deleteRecord(
    viewerId: string,
    appId: string,
    formId: string,
    recordId: string
  ): Promise<Record | null> {
    const form = await this.formService.selectForm(viewerId, appId, formId)
    if (!form) {
      throw new Error(`Form ${formId} not found`)
    }

    return this.recordModel.findOneAndUpdate(
      { _id: recordId, form: formId },
      {
        $set: {
          deletedAt: Date.now(),
        },
      },
      { new: true }
    )
  }

  async postCreateEvent(applicationId: string, formId: string, record: Record) {
    await this.workflowService.onCreateRecordSuccess(applicationId, formId, record)
  }
}
