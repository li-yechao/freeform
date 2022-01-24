import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { CreateApplicationInput, UpdateApplicationInput } from './application.input'
import { Application } from './application.schema'

@Injectable()
export class ApplicationService {
  constructor(
    @InjectModel(Application.name) private readonly applicationModel: Model<Application>
  ) {}

  async selectApplications(owner: string): Promise<Application[]> {
    return this.applicationModel.find({ owner, deletedAt: null })
  }

  async selectApplication(owner: string, appId: string): Promise<Application | null> {
    return this.applicationModel.findOne({ _id: appId, owner, deletedAt: null })
  }

  async createApplication(owner: string, input: CreateApplicationInput): Promise<Application> {
    return this.applicationModel.create({
      owner,
      name: input.name,
      createdAt: Date.now(),
    })
  }

  async updateApplication(
    owner: string,
    appId: string,
    input: UpdateApplicationInput
  ): Promise<Application | null> {
    return this.applicationModel.findOneAndUpdate(
      { _id: appId, owner, deletedAt: null },
      { $set: { name: input.name, updatedAt: Date.now() } },
      { new: true }
    )
  }

  async deleteApplication(owner: string, appId: string): Promise<Application | null> {
    return this.applicationModel.findOneAndUpdate(
      { _id: appId, owner, deletedAt: null },
      { $set: { deletedAt: Date.now() } },
      { new: true }
    )
  }
}
