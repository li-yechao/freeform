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
import {
  Args,
  Field,
  Int,
  Mutation,
  ObjectType,
  Parent,
  ResolveField,
  Resolver,
} from '@nestjs/graphql'
import { GqlAuthGuard } from '../../auth/gql-auth.guard'
import { Connection, ConnectionOptions, PageInfo } from '../../utils/Connection'
import {
  CreateWorkflowInput,
  UpdateWorkflowInput,
  WorkflowOrder,
  WorkflowOrderField,
} from '../inputs/workflow.input'
import { Application } from '../schemas/application.schema'
import { Workflow } from '../schemas/workflow.schema'
import { WorkflowService } from '../services/workflow.service'

@Resolver(() => Application)
@UseGuards(GqlAuthGuard)
export class WorkflowResolver {
  constructor(private readonly workflowService: WorkflowService) {}

  @ResolveField(() => WorkflowConnection)
  async workflows(
    @Parent() application: Application,
    @Args('before', { nullable: true }) before?: string,
    @Args('after', { nullable: true }) after?: string,
    @Args('first', { type: () => Int, nullable: true }) first?: number,
    @Args('last', { type: () => Int, nullable: true }) last?: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number,
    @Args('orderBy', { type: () => WorkflowOrder, nullable: true }) orderBy?: WorkflowOrder
  ): Promise<WorkflowConnection> {
    return new WorkflowConnection({
      before,
      after,
      first,
      last,
      offset,
      orderBy,
      find: options => this.workflowService.find({ applicationId: application.id, ...options }),
      count: options => this.workflowService.count({ applicationId: application.id, ...options }),
    })
  }

  @ResolveField(() => Workflow)
  async workflow(
    @Parent() application: Application,
    @Args('workflowId') workflowId: string
  ): Promise<Workflow> {
    return this.workflowService.findOne({ applicationId: application.id, workflowId })
  }

  @Mutation(() => Workflow)
  async createWorkflow(
    @Args('applicationId') applicationId: string,
    @Args('input') input: CreateWorkflowInput
  ): Promise<Workflow> {
    return this.workflowService.create({ applicationId, input })
  }

  @Mutation(() => Workflow)
  async updateWorkflow(
    @Args('applicationId') applicationId: string,
    @Args('workflowId') workflowId: string,
    @Args('input') input: UpdateWorkflowInput
  ): Promise<Workflow> {
    return this.workflowService.update({ applicationId, workflowId, input })
  }

  @Mutation(() => Workflow)
  async deleteWorkflow(
    @Args('applicationId') applicationId: string,
    @Args('workflowId') workflowId: string
  ): Promise<Workflow> {
    return this.workflowService.delete({ applicationId, workflowId })
  }
}

@ObjectType()
export class WorkflowConnection extends Connection<Workflow> {
  constructor({
    orderBy,
    ...options
  }: Omit<ConnectionOptions<Workflow>, 'orderBy'> & { orderBy?: WorkflowOrder }) {
    super({
      ...options,
      orderBy: orderBy && {
        field: (
          {
            [WorkflowOrderField.CREATED_AT]: 'createdAt',
            [WorkflowOrderField.UPDATED_AT]: 'updatedAt',
          } as const
        )[orderBy.field],
        direction: orderBy.direction,
      },
    })
  }

  @Field(() => [Workflow])
  override get nodes(): Promise<Workflow[]> {
    return super.nodes
  }

  @Field(() => [WorkflowEdge])
  override get edges(): Promise<WorkflowEdge[]> {
    return super.edges
  }

  @Field(() => PageInfo)
  override get pageInfo(): PageInfo {
    return super.pageInfo
  }

  @Field(() => Int)
  override get totalCount(): Promise<number> {
    return super.totalCount
  }
}

@ObjectType()
export class WorkflowEdge {
  @Field(() => String)
  cursor!: string

  @Field(() => Workflow)
  node!: Workflow
}
