import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { ApplicationService } from 'src/application/application.service'
import { CreateFormInput, UpdateFormInput } from './form.input'
import { Form } from './form.schema'

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

  private async checkApplication(userId: string, appId: string) {
    const app = await this.applicationService.selectApplication(userId, appId)
    if (!app) {
      throw new Error(`Application ${appId} is not found`)
    }
  }
}
