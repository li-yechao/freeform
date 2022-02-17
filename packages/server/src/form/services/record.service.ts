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

  async selectRecord({
    viewerId,
    applicationId,
    formId,
    viewId,
    recordId,
  }: {
    viewerId: string
    applicationId: string
    formId: string
    viewId: string
    recordId: string
  }): Promise<Record | null> {
    const form = await this.formService.selectForm(viewerId, applicationId, formId)
    if (!form) {
      throw new Error(`Form ${formId} not found`)
    }
    const view = form.views?.find(i => i.id === viewId)
    if (!view) {
      throw new Error(`View ${viewId} not found`)
    }

    const record = await this.recordModel.findOne({ _id: recordId, formId, deletedAt: null })

    // TODO: remove fields that not exists in the view

    return record
  }

  async selectRecords({
    viewerId,
    applicationId,
    formId,
    viewId,
    page,
    limit,
  }: {
    viewerId: string
    applicationId: string
    formId: string
    viewId: string
    page: number
    limit: number
  }): Promise<Record[]> {
    const form = await this.formService.selectForm(viewerId, applicationId, formId)
    if (!form) {
      throw new Error(`Form ${formId} not found`)
    }
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

  async selectRecordCount({
    viewerId,
    applicationId,
    formId,
    viewId,
  }: {
    viewerId: string
    applicationId: string
    formId: string
    viewId: string
  }): Promise<number> {
    const form = await this.formService.selectForm(viewerId, applicationId, formId)
    if (!form) {
      throw new Error(`Form ${formId} not found`)
    }
    const view = form.views?.find(i => i.id === viewId)
    if (!view) {
      throw new Error(`View ${viewId} not found`)
    }

    return this.recordModel.countDocuments({ formId, deletedAt: null })
  }

  async selectRecordsByAssociationFormFieldSearch({
    viewerId,
    applicationId,
    formId,
    sourceFormId,
    sourceFieldId,
    page,
    limit,
    recordIds,
  }: {
    viewerId: string
    applicationId: string
    formId: string
    sourceFormId: string
    sourceFieldId: string
    page: number
    limit: number
    recordIds?: string[] | undefined
  }): Promise<Record[]> {
    const form = await this.formService.selectForm(viewerId, applicationId, formId)
    if (!form) {
      throw new Error(`Form ${formId} not found`)
    }
    const sourceForm = await this.formService.selectForm(viewerId, applicationId, sourceFormId)
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

  async selectRecordCountByAssociationFormFieldSearch({
    viewerId,
    applicationId,
    formId,
  }: {
    viewerId: string
    applicationId: string
    formId: string
  }): Promise<number> {
    const form = await this.formService.selectForm(viewerId, applicationId, formId)
    if (!form) {
      throw new Error(`Form ${formId} not found`)
    }

    return this.recordModel.countDocuments({ formId, deletedAt: null })
  }

  async createRecord({
    viewerId,
    applicationId,
    formId,
    input,
  }: {
    viewerId: string
    applicationId: string
    formId: string
    input: CreateRecordInput
  }): Promise<Record> {
    const form = await this.formService.selectForm(viewerId, applicationId, formId)
    if (!form) {
      throw new Error(`Form ${formId} not found`)
    }

    const record = await this._createRecord({
      userId: viewerId,
      formId,
      data: input.data,
    })

    // post create record event
    {
      this.workflowService.onCreateRecordSuccess(viewerId, applicationId, formId, record)
    }

    return record
  }

  async updateRecord({
    viewerId,
    applicationId,
    formId,
    recordId,
    input,
  }: {
    viewerId: string
    applicationId: string
    formId: string
    recordId: string
    input: UpdateRecordInput
  }): Promise<Record | null> {
    const form = await this.formService.selectForm(viewerId, applicationId, formId)
    if (!form) {
      throw new Error(`Form ${formId} not found`)
    }

    const record = await this._updateRecord({ formId, recordId, data: input.data })

    // post create record event
    {
      record && this.workflowService.onUpdateRecordSuccess(viewerId, applicationId, formId, record)
    }

    return record
  }

  async deleteRecord({
    viewerId,
    applicationId,
    formId,
    recordId,
  }: {
    viewerId: string
    applicationId: string
    formId: string
    recordId: string
  }): Promise<Record | null> {
    const form = await this.formService.selectForm(viewerId, applicationId, formId)
    if (!form) {
      throw new Error(`Form ${formId} not found`)
    }

    const record = await this._deleteRecord({ formId, recordId })

    // post create record event
    {
      record && this.workflowService.onDeleteRecordSuccess(viewerId, applicationId, formId, record)
    }

    return record
  }

  async workflow_selectRecord({
    formId,
    recordId,
  }: {
    formId: string
    recordId: string
  }): Promise<Record | null> {
    return this._selectRecord({ formId, recordId })
  }

  async workflow_createRecord({
    userId,
    formId,
    data,
  }: {
    userId: string
    formId: string
    data: { [key: string]: { value: any } }
  }): Promise<Record | null> {
    return this._createRecord({ userId, formId, data })
  }

  async workflow_updateRecord({
    formId,
    recordId,
    data,
  }: {
    formId: string
    recordId: string
    data: { [key: string]: { value: any } }
  }): Promise<Record | null> {
    return this._updateRecord({ formId, recordId, data })
  }

  async workflow_deleteRecord({
    formId,
    recordId,
  }: {
    formId: string
    recordId: string
  }): Promise<Record | null> {
    return this._deleteRecord({ formId, recordId })
  }

  private async _selectRecord({
    formId,
    recordId,
  }: {
    formId: string
    recordId: string
  }): Promise<Record | null> {
    return this.recordModel.findOne({ _id: recordId, formId, deletedAt: null })
  }

  private async _createRecord({
    userId,
    formId,
    data,
  }: {
    userId: string
    formId: string
    data?: { [key: string]: { value: any } }
  }): Promise<Record> {
    // TODO: verify input data schema

    return this.recordModel.create({
      userId,
      formId,
      createdAt: Date.now(),
      data,
    })
  }

  private async _updateRecord({
    formId,
    recordId,
    data = {},
  }: {
    formId: string
    recordId: string
    data?: { [key: string]: { value: any } } | undefined
  }): Promise<Record | null> {
    // TODO: verify input data schema

    const update = Object.entries(data).reduce(
      (res, [key, value]) => Object.assign(res, { [`data.${key}`]: value }),
      {}
    )

    return this.recordModel.findOneAndUpdate(
      { _id: recordId, formId, deletedAt: null },
      { $set: { updatedAt: Date.now(), ...update } },
      { new: true }
    )
  }

  private async _deleteRecord({
    formId,
    recordId,
  }: {
    formId: string
    recordId: string
  }): Promise<Record | null> {
    return this.recordModel.findOneAndUpdate(
      { _id: recordId, formId, deletedAt: null },
      { $set: { deletedAt: Date.now() } },
      { new: true }
    )
  }
}
