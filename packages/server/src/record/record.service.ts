import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { FormService } from '../form/form.service'
import { CreateRecordInput, UpdateRecordInput } from './record.input'
import { Record } from './record.schema'

@Injectable()
export class RecordService {
  constructor(
    @InjectModel(Record.name) private readonly recordModel: Model<Record>,
    private readonly formService: FormService
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

    return this.recordModel.create({
      owner: viewerId,
      form: formId,
      createdAt: Date.now(),
      data,
    })
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
}
