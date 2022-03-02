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
import workflowToBpmn from '../camunda/workflowToBpmn'
import { CreateWorkflowInput, UpdateWorkflowInput } from '../inputs/workflow.input'
import { Record } from '../schemas/record.schema'
import { Workflow } from '../schemas/workflow.schema'
import { CamundaService } from './camunda.service'

@Injectable()
export class WorkflowService {
  constructor(
    @InjectModel(Workflow.name) private readonly workflowModel: Model<Workflow>,
    private readonly camundaService: CamundaService
  ) {}

  async findOne({ workflowId }: { workflowId: string }): Promise<Workflow> {
    const workflow = await this.workflowModel.findOne({
      _id: workflowId,
      deletedAt: null,
    })
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`)
    }
    return workflow
  }

  async findAllByApplicationId({ applicationId }: { applicationId: string }): Promise<Workflow[]> {
    return this.workflowModel.find({ applicationId, deletedAt: null })
  }

  async create(
    { applicationId }: { applicationId: string },
    input: CreateWorkflowInput
  ): Promise<Workflow> {
    const workflow = await this.workflowModel.create({
      applicationId,
      createdAt: Date.now(),
      ...input,
    })

    await this.deployBpmnToCamunda(workflow)

    return workflow
  }

  async update(
    { workflowId }: { workflowId: string },
    input: UpdateWorkflowInput
  ): Promise<Workflow> {
    const workflow = await this.workflowModel.findOneAndUpdate(
      { _id: workflowId, deletedAt: null },
      {
        $set: {
          updatedAt: Date.now(),
          ...input,
        },
      },
      { new: true }
    )

    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`)
    }

    await this.deployBpmnToCamunda(workflow)

    return workflow
  }

  async delete({ workflowId }: { workflowId: string }): Promise<Workflow> {
    const workflow = await this.workflowModel.findOneAndUpdate(
      { _id: workflowId, deletedAt: null },
      { $set: { deletedAt: Date.now() } },
      { new: true }
    )

    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`)
    }
    return workflow
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
