import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { ApplicationService } from 'src/application/application.service'
import { CreateFormInput, UpdateFormInput, ViewInput } from './form.input'
import { Form, View } from './form.schema'

@Injectable()
export class FormService {
  constructor(
    private readonly applicationService: ApplicationService,
    @InjectModel(Form.name) private readonly formModel: Model<Form>
  ) {}

  async selectForms(userId: string, appId: string): Promise<Form[]> {
    await this.checkApplication(userId, appId)

    return this.formModel.find({ application: appId, deletedAt: null })
  }

  async selectForm(userId: string, appId: string, formId: string): Promise<Form | null> {
    await this.checkApplication(userId, appId)

    return this.formModel.findOne({ _id: formId, application: appId, deletedAt: null })
  }

  async createForm(userId: string, appId: string, input: CreateFormInput): Promise<Form> {
    await this.checkApplication(userId, appId)

    return this.formModel.create({
      application: appId,
      createdAt: Date.now(),
      ...input,
    })
  }

  async updateForm(
    userId: string,
    appId: string,
    formId: string,
    input: UpdateFormInput
  ): Promise<Form | null> {
    await this.checkApplication(userId, appId)

    return this.formModel.findOneAndUpdate(
      { _id: formId, application: appId, deletedAt: null },
      {
        $set: {
          updatedAt: Date.now(),
          ...input,
        },
      },
      { new: true }
    )
  }

  async deleteForm(userId: string, appId: string, formId: string): Promise<Form | null> {
    await this.checkApplication(userId, appId)

    return this.formModel.findOneAndUpdate(
      { _id: formId, application: appId, deletedAt: null },
      { $set: { deletedAt: Date.now() } }
    )
  }

  async createView(userId: string, appId: string, formId: string, input: ViewInput): Promise<View> {
    await this.checkForm(userId, appId, formId)

    return this.formModel
      .findOneAndUpdate(
        { _id: formId, application: appId, deletedAt: null },
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
    appId: string,
    formId: string,
    viewId: string,
    input: ViewInput
  ): Promise<View | null> {
    await this.checkForm(userId, appId, formId)

    return this.formModel
      .findOneAndUpdate(
        { _id: formId, application: appId, deletedAt: null, 'views._id': viewId },
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
    appId: string,
    formId: string,
    viewId: string
  ): Promise<Form | null> {
    await this.checkForm(userId, appId, formId)

    return this.formModel.findOneAndUpdate(
      { _id: formId, application: appId, deletedAt: null },
      {
        $set: { updatedAt: Date.now() },
        $pull: { views: { _id: viewId } },
      },
      { new: true }
    )
  }

  private async checkApplication(userId: string, appId: string) {
    const app = await this.applicationService.selectApplication(userId, appId)
    if (!app) {
      throw new Error(`Application ${appId} is not found`)
    }
  }

  private async checkForm(userId: string, appId: string, formId: string) {
    const form = await this.selectForm(userId, appId, formId)
    if (!form) {
      throw new Error(`Form ${formId} is not found`)
    }
  }
}
