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
import { CreateFormInput, UpdateFormInput, ViewInput } from '../inputs/form.input'
import { Form, View } from '../schemas/form.schema'

@Injectable()
export class FormService {
  constructor(@InjectModel(Form.name) private readonly formModel: Model<Form>) {}

  async findOne({
    applicationId,
    formId,
  }: {
    applicationId?: string
    formId: string
  }): Promise<Form> {
    const form = await this.formModel.findOne({ _id: formId, applicationId, deletedAt: null })
    if (!form) {
      throw new Error(`Form ${formId} not found`)
    }
    return form
  }

  async find({
    applicationId,
    filter,
    sort,
    offset,
    limit,
  }: {
    applicationId: string
    filter?: FilterQuery<Form>
    sort?: { [key in keyof Form]?: 1 | -1 }
    offset?: number
    limit?: number
  }): Promise<Form[]> {
    return this.formModel.find({ applicationId, deletedAt: null, ...filter }, null, {
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
    filter?: FilterQuery<Form>
  }): Promise<number> {
    return this.formModel.countDocuments({ applicationId, deletedAt: null, ...filter })
  }

  async create({
    applicationId,
    input,
  }: {
    applicationId: string
    input: CreateFormInput
  }): Promise<Form> {
    return this.formModel.create({
      applicationId,
      createdAt: Date.now(),
      ...input,
    })
  }

  async update({
    applicationId,
    formId,
    input,
  }: {
    applicationId?: string
    formId: string
    input: UpdateFormInput
  }): Promise<Form> {
    const form = await this.formModel.findOneAndUpdate(
      { _id: formId, applicationId, deletedAt: null },
      {
        $set: {
          updatedAt: Date.now(),
          ...input,
        },
      },
      { new: true }
    )
    if (!form) {
      throw new Error(`Form ${formId} not found`)
    }
    return form
  }

  async delete({
    applicationId,
    formId,
  }: {
    applicationId?: string
    formId: string
  }): Promise<Form> {
    const form = await this.formModel.findOneAndUpdate(
      { _id: formId, applicationId, deletedAt: null },
      { $set: { deletedAt: Date.now() } },
      { new: true }
    )
    if (!form) {
      throw new Error(`Form ${formId} not found`)
    }
    return form
  }

  async createView({
    applicationId,
    formId,
    input,
  }: {
    applicationId?: string
    formId: string
    input: ViewInput
  }): Promise<View> {
    const form = await this.formModel.findOneAndUpdate(
      { _id: formId, applicationId, deletedAt: null },
      {
        $set: {
          updatedAt: Date.now(),
        },
        $push: {
          views: {
            name: input.name,
            fields: input.fields,
          },
        },
      },
      { new: true }
    )

    const view = form?.views?.at(-1)
    if (!view) {
      throw new Error(`View not found`)
    }
    return view
  }

  async updateView({
    applicationId,
    formId,
    viewId,
    input,
  }: {
    applicationId?: string
    formId: string
    viewId: string
    input: ViewInput
  }): Promise<View> {
    const form = await this.formModel.findOneAndUpdate(
      { _id: formId, applicationId, deletedAt: null, 'views._id': viewId },
      {
        $set: {
          updatedAt: Date.now(),
          'views.$.name': input.name,
          'views.$.fields': input.fields,
        },
      },
      { new: true }
    )

    const view = form?.views?.find(i => i.id === viewId)
    if (!view) {
      throw new Error(`View ${viewId} not found`)
    }
    return view
  }

  async deleteView({
    applicationId,
    formId,
    viewId,
  }: {
    applicationId?: string
    formId: string
    viewId: string
  }): Promise<View> {
    const form = await this.findOne({ applicationId, formId })
    const view = form.views?.find(i => i.id === viewId)
    if (!view) {
      throw new Error(`Form ${formId} not found`)
    }

    await this.formModel.findOneAndUpdate(
      { _id: formId, applicationId, deletedAt: null },
      {
        $set: { updatedAt: Date.now() },
        $pull: { views: { _id: viewId } },
      }
    )

    return view
  }
}
