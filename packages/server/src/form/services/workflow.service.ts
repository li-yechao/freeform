import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import workflowToBpmn from '../camunda/workflowToBpmn'
import { CreateWorkflowInput, UpdateWorkflowInput } from '../inputs/workflow.input'
import { Record } from '../schemas/record.schema'
import { Workflow } from '../schemas/workflow.schema'
import { ApplicationService } from './application.service'
import { CamundaService } from './camunda.service'

@Injectable()
export class WorkflowService {
  constructor(
    @InjectModel(Workflow.name) private readonly workflowModel: Model<Workflow>,
    private readonly applicationService: ApplicationService,
    private readonly camundaService: CamundaService
  ) {}

  async selectWorkflows(viewerId: string, applicationId: string): Promise<Workflow[]> {
    await this.checkApplication(viewerId, applicationId)

    return this.workflowModel.find({ applicationId, deletedAt: null })
  }

  async selectWorkflow(
    viewerId: string,
    applicationId: string,
    workflowId: string
  ): Promise<Workflow | null> {
    await this.checkApplication(viewerId, applicationId)

    return this.workflowModel.findOne({
      _id: workflowId,
      applicationId,
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
      applicationId,
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
      { _id: workflowId, applicationId, deletedAt: null },
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
      { _id: workflowId, applicationId, deletedAt: null },
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
    if (workflow.trigger && workflow.children.length) {
      await this.camundaService.deployProcess({
        name: workflow.id,
        definition: await workflowToBpmn(workflow),
      })
    }
  }

  async onCreateRecordSuccess(
    viewerId: string,
    applicationId: string,
    formId: string,
    record: Record
  ) {
    const workflows = await this.workflowModel.find({
      applicationId,
      deletedAt: null,
      'trigger.type': 'form_trigger',
      'trigger.formId': formId,
      'trigger.actions.type': 'create',
    })
    for (const workflow of workflows) {
      this.camundaService.createProcessInstance({
        workflowId: workflow.id,
        variables: {
          form_trigger_viewer_id: viewerId,
          form_trigger_application_id: applicationId,
          form_trigger_form_id: formId,
          form_trigger_record: record,
        },
      })
    }
  }

  async onUpdateRecordSuccess(
    viewerId: string,
    applicationId: string,
    formId: string,
    record: Record
  ) {
    const workflows = await this.workflowModel.find({
      applicationId,
      deletedAt: null,
      'trigger.type': 'form_trigger',
      'trigger.formId': formId,
      'trigger.actions.type': 'update',
    })
    for (const workflow of workflows) {
      this.camundaService.createProcessInstance({
        workflowId: workflow.id,
        variables: {
          form_trigger_viewer_id: viewerId,
          form_trigger_application_id: applicationId,
          form_trigger_form_id: formId,
          form_trigger_record: record,
        },
      })
    }
  }

  async onDeleteRecordSuccess(
    viewerId: string,
    applicationId: string,
    formId: string,
    record: Record
  ) {
    const workflows = await this.workflowModel.find({
      applicationId,
      deletedAt: null,
      'trigger.type': 'form_trigger',
      'trigger.formId': formId,
      'trigger.actions.type': 'delete',
    })
    for (const workflow of workflows) {
      this.camundaService.createProcessInstance({
        workflowId: workflow.id,
        variables: {
          form_trigger_viewer_id: viewerId,
          form_trigger_application_id: applicationId,
          form_trigger_form_id: formId,
          form_trigger_record: record,
        },
      })
    }
  }
}
