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
import { FormService } from './form.service'
import { WorkflowService } from './workflow.service'

@Injectable()
export class RecordService {
  constructor(
    @InjectModel(Record.name) private readonly recordModel: Model<Record>,
    private readonly formService: FormService,
    private readonly workflowService: WorkflowService
  ) {}

  async findOne({
    formId,
    viewId,
    recordId,
  }: {
    formId: string
    viewId?: string
    recordId: string
  }): Promise<Record> {
    const form = await this.formService.findOne({ formId })

    const view = viewId ? form.views?.find(i => i.id === viewId) : undefined
    if (viewId && !view) {
      throw new Error(`View ${viewId} not found`)
    }

    const record = await this.recordModel.findOne({ _id: recordId, formId, deletedAt: null })

    if (!record) {
      throw new Error(`Record ${recordId} not found`)
    }

    // TODO: remove fields that not exists in the view

    return record
  }

  async find({
    formId,
    viewId,
    page,
    limit,
  }: {
    formId: string
    viewId: string
    page: number
    limit: number
  }): Promise<Record[]> {
    const form = await this.formService.findOne({ formId })

    const view = form.views?.find(i => i.id === viewId)
    if (!view) {
      throw new Error(`View ${viewId} not found`)
    }

    const records = await this.recordModel
      .find({ formId, deletedAt: null })
      .sort({ _id: -1 })
      .skip(page * limit)
      .limit(limit)

    // TODO: remove fields that not exists in the view

    return records
  }

  async count({ formId }: { formId: string }): Promise<number> {
    return this.recordModel.countDocuments({ formId, deletedAt: null })
  }

  async findByAssociationFormField({
    formId,
    sourceFormId,
    sourceFieldId,
    page,
    limit,
    recordIds,
  }: {
    formId: string
    sourceFormId: string
    sourceFieldId: string
    page: number
    limit: number
    recordIds?: string[] | undefined
  }): Promise<Record[]> {
    const form = await this.formService.findOne({ formId })
    const sourceForm = await this.formService.findOne({ formId: sourceFormId })
    const sourceField = sourceForm?.fields?.find(i => i.id === sourceFieldId)
    if (!sourceField) {
      throw new Error(`Source field ${sourceFieldId} not found`)
    }
    if (sourceField.type !== 'associationForm') {
      throw new Error(
        `Source field ${sourceFieldId} type ${sourceField.type} is not an associationForm`
      )
    }
    if (sourceField.meta?.['associationFormId'] !== formId) {
      throw new Error(`Source field ${sourceFieldId} associationFormId is not match`)
    }
    const mainFieldId = sourceField.meta?.['mainFieldId']
    const mainField = form.fields?.find(i => i.id === mainFieldId)
    if (!mainField) {
      throw new Error(`Source field ${sourceFieldId} mainField is not found`)
    }

    const filter: FilterQuery<Record> = { formId, deletedAt: null }
    if (recordIds?.length) {
      filter['_id'] = { $in: [recordIds] }
    }

    const records = await this.recordModel
      .find(filter, {
        id: 1,
        userId: 1,
        formId: 1,
        createdAt: 1,
        updatedAt: 1,
        [`data.${mainField.id}`]: 1,
      })
      .sort({ _id: -1 })
      .skip(page * limit)
      .limit(limit)

    return records
  }

  async create(
    {
      viewerId,
      formId,
      emitToWorkflow = false,
    }: {
      viewerId: string
      formId: string
      emitToWorkflow?: boolean
    },
    input: CreateRecordInput
  ): Promise<Record> {
    const form = await this.formService.findOne({ formId })

    const record = await this.recordModel.create({
      userId: viewerId,
      formId,
      createdAt: Date.now(),
      data: input.data,
    })

    // post create record event
    if (emitToWorkflow) {
      this.workflowService.onCreateRecordSuccess(
        viewerId,
        form.applicationId.toHexString(),
        formId,
        record
      )
    }

    return record
  }

  async update(
    {
      viewerId,
      formId,
      recordId,
      emitToWorkflow = false,
    }: {
      viewerId: string
      formId: string
      recordId: string
      emitToWorkflow?: boolean
    },
    input: UpdateRecordInput
  ): Promise<Record> {
    const form = await this.formService.findOne({ formId })

    // TODO: verify input data schema
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

    // post update record event
    if (emitToWorkflow) {
      this.workflowService.onUpdateRecordSuccess(
        viewerId,
        form.applicationId.toHexString(),
        formId,
        record
      )
    }

    return record
  }

  async delete({
    viewerId,
    formId,
    recordId,
    emitToWorkflow = false,
  }: {
    viewerId: string
    formId: string
    recordId: string
    emitToWorkflow?: boolean
  }): Promise<Record> {
    const form = await this.formService.findOne({ formId })

    const record = await this.recordModel.findOneAndUpdate(
      { _id: recordId, formId, deletedAt: null },
      { $set: { deletedAt: Date.now() } },
      { new: true }
    )

    if (!record) {
      throw new Error(`Record ${recordId} not found`)
    }

    // post delete record event
    if (emitToWorkflow) {
      this.workflowService.onDeleteRecordSuccess(
        viewerId,
        form.applicationId.toHexString(),
        formId,
        record
      )
    }

    return record
  }
}
