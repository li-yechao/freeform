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

import { UseGuards } from '@nestjs/common'
import { Args, Mutation, Parent, ResolveField, Resolver } from '@nestjs/graphql'
import { Viewer } from '../../auth/auth.schema'
import { CurrentUser, GqlAuthGuard } from '../../auth/gql-auth.guard'
import { CreateWorkflowInput, UpdateWorkflowInput } from '../inputs/workflow.input'
import { Application } from '../schemas/application.schema'
import { Workflow } from '../schemas/workflow.schema'
import { WorkflowService } from '../services/workflow.service'

@Resolver(() => Application)
@UseGuards(GqlAuthGuard)
export class WorkflowResolver {
  constructor(private readonly workflowService: WorkflowService) {}

  @ResolveField(() => [Workflow])
  async workflows(
    @CurrentUser() viewer: Viewer,
    @Parent() application: Application
  ): Promise<Workflow[]> {
    return this.workflowService.selectWorkflows(viewer.id, application.id)
  }

  @ResolveField(() => Workflow)
  async workflow(
    @CurrentUser() viewer: Viewer,
    @Parent() application: Application,
    @Args('workflowId') workflowId: string
  ): Promise<Workflow> {
    const workflow = await this.workflowService.selectWorkflow(
      viewer.id,
      application.id,
      workflowId
    )
    if (!workflow) {
      throw new Error('Not found')
    }
    return workflow
  }

  @Mutation(() => Workflow)
  async createWorkflow(
    @CurrentUser() viewer: Viewer,
    @Args('applicationId') applicationId: string,
    @Args('input') input: CreateWorkflowInput
  ): Promise<Workflow> {
    return this.workflowService.createWorkflow(viewer.id, applicationId, input)
  }

  @Mutation(() => Workflow)
  async updateWorkflow(
    @CurrentUser() viewer: Viewer,
    @Args('applicationId') applicationId: string,
    @Args('workflowId') workflowId: string,
    @Args('input') input: UpdateWorkflowInput
  ): Promise<Workflow> {
    const workflow = await this.workflowService.updateWorkflow(
      viewer.id,
      applicationId,
      workflowId,
      input
    )
    if (!workflow) {
      throw new Error('Not found')
    }
    return workflow
  }

  @Mutation(() => Boolean)
  async deleteWorkflow(
    @CurrentUser() viewer: Viewer,
    @Args('applicationId') applicationId: string,
    @Args('workflowId') workflowId: string
  ): Promise<boolean> {
    const workflow = await this.workflowService.deleteWorkflow(viewer.id, applicationId, workflowId)
    if (!workflow) {
      throw new Error('Not found')
    }
    return true
  }
}
