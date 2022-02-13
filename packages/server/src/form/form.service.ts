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
import { ApplicationService } from '../application/application.service'
import { CreateFormInput, UpdateFormInput, ViewInput } from './form.input'
import { Form, View } from './form.schema'

@Injectable()
export class FormService {
  constructor(
    private readonly applicationService: ApplicationService,
    @InjectModel(Form.name) private readonly formModel: Model<Form>
  ) {}

  async selectForms(userId: string, applicationId: string): Promise<Form[]> {
    await this.checkApplication(userId, applicationId)

    return this.formModel.find({ applicationId, deletedAt: null })
  }

  async selectForm(userId: string, applicationId: string, formId: string): Promise<Form | null> {
    await this.checkApplication(userId, applicationId)

    return this.formModel.findOne({ _id: formId, applicationId, deletedAt: null })
  }

  async createForm(userId: string, applicationId: string, input: CreateFormInput): Promise<Form> {
    await this.checkApplication(userId, applicationId)

    return this.formModel.create({
      applicationId,
      createdAt: Date.now(),
      ...input,
    })
  }

  async updateForm(
    userId: string,
    applicationId: string,
    formId: string,
    input: UpdateFormInput
  ): Promise<Form | null> {
    await this.checkApplication(userId, applicationId)

    return this.formModel.findOneAndUpdate(
      { _id: formId, applicationId, deletedAt: null },
      {
        $set: {
          updatedAt: Date.now(),
          ...input,
        },
      },
      { new: true }
    )
  }

  async deleteForm(userId: string, applicationId: string, formId: string): Promise<Form | null> {
    await this.checkApplication(userId, applicationId)

    return this.formModel.findOneAndUpdate(
      { _id: formId, applicationId, deletedAt: null },
      { $set: { deletedAt: Date.now() } }
    )
  }

  async createView(
    userId: string,
    applicationId: string,
    formId: string,
    input: ViewInput
  ): Promise<View> {
    await this.checkForm(userId, applicationId, formId)

    return this.formModel
      .findOneAndUpdate(
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
      .then(form => {
        const last = form?.views?.at(-1)
        if (!last) {
          throw new Error(`Views should not empty`)
        }
        return last
      })
  }

  async updateView(
    userId: string,
    applicationId: string,
    formId: string,
    viewId: string,
    input: ViewInput
  ): Promise<View | null> {
    await this.checkForm(userId, applicationId, formId)

    return this.formModel
      .findOneAndUpdate(
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
      .then(form => form?.views?.find(i => i.id === viewId) ?? null)
  }

  async deleteView(
    userId: string,
    applicationId: string,
    formId: string,
    viewId: string
  ): Promise<Form | null> {
    await this.checkForm(userId, applicationId, formId)

    return this.formModel.findOneAndUpdate(
      { _id: formId, applicationId, deletedAt: null },
      {
        $set: { updatedAt: Date.now() },
        $pull: { views: { _id: viewId } },
      },
      { new: true }
    )
  }

  private async checkApplication(userId: string, applicationId: string) {
    const app = await this.applicationService.selectApplication(userId, applicationId)
    if (!app) {
      throw new Error(`Application ${applicationId} is not found`)
    }
  }

  private async checkForm(userId: string, applicationId: string, formId: string) {
    const form = await this.selectForm(userId, applicationId, formId)
    if (!form) {
      throw new Error(`Form ${formId} is not found`)
    }
  }
}
