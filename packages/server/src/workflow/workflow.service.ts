import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { ApplicationService } from '../application/application.service'
import CamundaAPI from '../camunda/CamundaAPI'
import workflowToBpmn from '../camunda/workflowToBpmn'
import { CreateWorkflowInput, UpdateWorkflowInput } from './workflow.input'
import { Workflow } from './workflow.schema'

@Injectable()
export class WorkflowService {
  constructor(
    @InjectModel(Workflow.name) private readonly workflowModel: Model<Workflow>,
    private readonly applicationService: ApplicationService,
    configService: ConfigService
  ) {
    const baseUrl = configService.get<string>('CAMUNDA_URI')
    if (!baseUrl) {
      throw new Error(`Required env CAMUNDA_URI is missing`)
    }
    this.camundaAPI = new CamundaAPI({ baseUrl })
  }

  private readonly camundaAPI: CamundaAPI

  async selectWorkflows(viewerId: string, applicationId: string): Promise<Workflow[]> {
    await this.checkApplication(viewerId, applicationId)

    return this.workflowModel.find({ application: applicationId, deletedAt: null })
  }

  async selectWorkflow(
    viewerId: string,
    applicationId: string,
    workflowId: string
  ): Promise<Workflow | null> {
    await this.checkApplication(viewerId, applicationId)

    return this.workflowModel.findOne({
      _id: workflowId,
      application: applicationId,
      deletedAt: null,
    })
  }

  async createWorkflow(
    userId: string,
    applicationId: string,
    input: CreateWorkflowInput
  ): Promise<Workflow> {
    await this.checkApplication(userId, applicationId)

    const workflow = await this.workflowModel.create({
      application: applicationId,
      createdAt: Date.now(),
      ...input,
    })

    await this.deployBpmnToCamunda(workflow)

    return workflow
  }

  async updateWorkflow(
    userId: string,
    applicationId: string,
    workflowId: string,
    input: UpdateWorkflowInput
  ): Promise<Workflow | null> {
    await this.checkApplication(userId, applicationId)

    const workflow = await this.workflowModel.findOneAndUpdate(
      { _id: workflowId, application: applicationId, deletedAt: null },
      {
        $set: {
          updatedAt: Date.now(),
          ...input,
        },
      },
      { new: true }
    )

    if (workflow) {
      await this.deployBpmnToCamunda(workflow)
    }

    return workflow
  }

  async deleteWorkflow(
    userId: string,
    applicationId: string,
    workflowId: string
  ): Promise<Workflow | null> {
    await this.checkApplication(userId, applicationId)

    return this.workflowModel.findOneAndUpdate(
      { _id: workflowId, application: applicationId, deletedAt: null },
      { $set: { deletedAt: Date.now() } },
      { new: true }
    )
  }

  private async checkApplication(viewerId: string, applicationId: string) {
    const app = await this.applicationService.selectApplication(viewerId, applicationId)
    if (!app) {
      throw new Error(`Application ${applicationId} is not found`)
    }
  }

  private async deployBpmnToCamunda(workflow: Workflow) {
    await this.camundaAPI.deploymentCreate({
      deploymentName: workflow.id,
      xml: await workflowToBpmn(workflow),
    })
  }
}
