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
import { GqlAuthGuard } from '../../auth/gql-auth.guard'
import { CreateWorkflowInput, UpdateWorkflowInput } from '../inputs/workflow.input'
import { Application } from '../schemas/application.schema'
import { Workflow } from '../schemas/workflow.schema'
import { WorkflowService } from '../services/workflow.service'

@Resolver(() => Application)
@UseGuards(GqlAuthGuard)
export class WorkflowResolver {
  constructor(private readonly workflowService: WorkflowService) {}

  @ResolveField(() => [Workflow])
  async workflows(@Parent() application: Application): Promise<Workflow[]> {
    return this.workflowService.findAllByApplicationId({ applicationId: application.id })
  }

  @ResolveField(() => Workflow)
  async workflow(@Args('workflowId') workflowId: string): Promise<Workflow> {
    return this.workflowService.findOne({ workflowId })
  }

  @Mutation(() => Workflow)
  async createWorkflow(
    @Args('applicationId') applicationId: string,
    @Args('input') input: CreateWorkflowInput
  ): Promise<Workflow> {
    return this.workflowService.create({ applicationId }, input)
  }

  @Mutation(() => Workflow)
  async updateWorkflow(
    @Args('applicationId') _applicationId: string,
    @Args('workflowId') workflowId: string,
    @Args('input') input: UpdateWorkflowInput
  ): Promise<Workflow> {
    return this.workflowService.update({ workflowId }, input)
  }

  @Mutation(() => Boolean)
  async deleteWorkflow(
    @Args('applicationId') _applicationId: string,
    @Args('workflowId') workflowId: string
  ): Promise<boolean> {
    await this.workflowService.delete({ workflowId })
    return true
  }
}
