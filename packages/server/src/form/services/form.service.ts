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
import { CreateFormInput, UpdateFormInput, ViewInput } from '../inputs/form.input'
import { Form, View } from '../schemas/form.schema'

@Injectable()
export class FormService {
  constructor(@InjectModel(Form.name) private readonly formModel: Model<Form>) {}

  async findOne({ formId }: { formId: string }): Promise<Form> {
    const form = await this.formModel.findOne({ _id: formId, deletedAt: null })
    if (!form) {
      throw new Error(`Form ${formId} not found`)
    }
    return form
  }

  async findAllByApplicationId({ applicationId }: { applicationId: string }): Promise<Form[]> {
    return this.formModel.find({ applicationId, deletedAt: null })
  }

  async create(
    { applicationId }: { applicationId: string },
    input: CreateFormInput
  ): Promise<Form> {
    return this.formModel.create({
      applicationId,
      createdAt: Date.now(),
      ...input,
    })
  }

  async update({ formId }: { formId: string }, input: UpdateFormInput): Promise<Form> {
    const form = await this.formModel.findOneAndUpdate(
      { _id: formId, deletedAt: null },
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

  async delete({ formId }: { formId: string }): Promise<Form> {
    const form = await this.formModel.findOneAndUpdate(
      { _id: formId, deletedAt: null },
      { $set: { deletedAt: Date.now() } },
      { new: true }
    )
    if (!form) {
      throw new Error(`Form ${formId} not found`)
    }
    return form
  }

  async createView({ formId }: { formId: string }, input: ViewInput): Promise<View> {
    const form = await this.formModel.findOneAndUpdate(
      { _id: formId, deletedAt: null },
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

  async updateView(
    { formId, viewId }: { formId: string; viewId: string },
    input: ViewInput
  ): Promise<View> {
    const form = await this.formModel.findOneAndUpdate(
      { _id: formId, deletedAt: null, 'views._id': viewId },
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

  async deleteView({ formId, viewId }: { formId: string; viewId: string }): Promise<Form> {
    const form = await this.formModel.findOneAndUpdate(
      { _id: formId, deletedAt: null },
      {
        $set: { updatedAt: Date.now() },
        $pull: { views: { _id: viewId } },
      },
      { new: true }
    )
    if (!form) {
      throw new Error(`Form ${formId} not found`)
    }
    return form
  }
}
