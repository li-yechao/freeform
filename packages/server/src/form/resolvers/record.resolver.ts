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
import { CurrentUser, GqlAuthGuard } from '../../auth/gql-auth.guard'
import { Connection, ConnectionOptions, PageInfo } from '../../utils/Connection'
import {
  CreateRecordInput,
  RecordOrder,
  RecordOrderField,
  UpdateRecordInput,
} from '../inputs/record.input'
import { Form } from '../schemas/form.schema'
import { Record } from '../schemas/record.schema'
import { RecordService } from '../services/record.service'

@Resolver(() => Form)
@UseGuards(GqlAuthGuard)
export class RecordResolver {
  constructor(private readonly recordService: RecordService) {}

  @ResolveField(() => RecordConnection)
  async records(
    @Parent() form: Form,
    @Args('viewId') _viewId: string,
    @Args('before', { nullable: true }) before?: string,
    @Args('after', { nullable: true }) after?: string,
    @Args('first', { type: () => Int, nullable: true }) first?: number,
    @Args('last', { type: () => Int, nullable: true }) last?: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number,
    @Args('orderBy', { type: () => RecordOrder, nullable: true }) orderBy?: RecordOrder
  ): Promise<RecordConnection> {
    return new RecordConnection({
      before,
      after,
      first,
      last,
      offset,
      orderBy,
      find: options => this.recordService.find({ formId: form.id, ...options }),
      count: options => this.recordService.count({ formId: form.id, ...options }),
    })
  }

  @ResolveField(() => Record)
  async record(
    @Parent() form: Form,
    @Args('viewId') _viewId: string,
    @Args('recordId') recordId: string
  ): Promise<Record> {
    return this.recordService.findOne({
      formId: form.id,
      recordId,
    })
  }

  @Mutation(() => Record)
  async createRecord(
    @CurrentUser() user: CurrentUser,
    @Args('applicationId') _applicationId: string,
    @Args('formId') formId: string,
    @Args('input') input: CreateRecordInput
  ): Promise<Record> {
    return await this.recordService.create({
      userId: user.id,
      formId,
      input,
      startWorkflowInstance: true,
    })
  }

  @Mutation(() => Record)
  async updateRecord(
    @CurrentUser() user: CurrentUser,
    @Args('applicationId') _applicationId: string,
    @Args('formId') formId: string,
    @Args('recordId') recordId: string,
    @Args('input') input: UpdateRecordInput
  ): Promise<Record> {
    return this.recordService.update({
      userId: user.id,
      formId,
      recordId,
      input,
      startWorkflowInstance: true,
    })
  }

  @Mutation(() => Boolean)
  async deleteRecord(
    @CurrentUser() user: CurrentUser,
    @Args('applicationId') _applicationId: string,
    @Args('formId') formId: string,
    @Args('recordId') recordId: string
  ): Promise<boolean> {
    await this.recordService.delete({
      userId: user.id,
      formId,
      recordId,
      startWorkflowInstance: true,
    })
    return true
  }
}

@ObjectType()
export class RecordConnection extends Connection<Record> {
  constructor({
    orderBy,
    ...options
  }: Omit<ConnectionOptions<Record>, 'orderBy'> & { orderBy?: RecordOrder }) {
    super({
      ...options,
      orderBy: orderBy && {
        field: (
          {
            [RecordOrderField.CREATED_AT]: 'createdAt',
            [RecordOrderField.UPDATED_AT]: 'updatedAt',
          } as const
        )[orderBy.field],
        direction: orderBy.direction,
      },
    })
  }

  @Field(() => [Record])
  override get nodes(): Promise<Record[]> {
    return super.nodes
  }

  @Field(() => [RecordEdge])
  override get edges(): Promise<RecordEdge[]> {
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
export class RecordEdge {
  @Field(() => String)
  cursor!: string

  @Field(() => Record)
  node!: Record
}
