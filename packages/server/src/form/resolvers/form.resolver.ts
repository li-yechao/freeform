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
  CreateFormInput,
  FormOrder,
  FormOrderField,
  UpdateFormInput,
  ViewInput,
} from '../inputs/form.input'
import { Application } from '../schemas/application.schema'
import { Form, View } from '../schemas/form.schema'
import { FormService } from '../services/form.service'

@Resolver(() => Application)
@UseGuards(GqlAuthGuard)
export class FormResolver {
  constructor(private readonly formService: FormService) {}

  @ResolveField(() => FormConnection)
  async forms(
    @Parent() application: Application,
    @Args('before', { nullable: true }) before?: string,
    @Args('after', { nullable: true }) after?: string,
    @Args('first', { type: () => Int, nullable: true }) first?: number,
    @Args('last', { type: () => Int, nullable: true }) last?: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number,
    @Args('orderBy', { type: () => FormOrder, nullable: true }) orderBy?: FormOrder
  ): Promise<FormConnection> {
    return new FormConnection({
      before,
      after,
      first,
      last,
      offset,
      orderBy,
      find: options => this.formService.find({ applicationId: application.id, ...options }),
      count: options => this.formService.count({ applicationId: application.id, ...options }),
    })
  }

  @ResolveField(() => Form)
  async form(@Parent() application: Application, @Args('formId') formId: string): Promise<Form> {
    return this.formService.findOne({ applicationId: application.id, formId })
  }

  @Mutation(() => Form)
  async createForm(
    @Args('applicationId') applicationId: string,
    @Args('input') input: CreateFormInput
  ): Promise<Form> {
    return this.formService.create({ applicationId, input })
  }

  @Mutation(() => Form)
  async updateForm(
    @Args('applicationId') applicationId: string,
    @Args('formId') formId: string,
    @Args('input') input: UpdateFormInput
  ): Promise<Form> {
    return this.formService.update({ applicationId, formId, input })
  }

  @Mutation(() => Form)
  async deleteForm(
    @Args('applicationId') applicationId: string,
    @Args('formId') formId: string
  ): Promise<Form> {
    return this.formService.delete({ applicationId, formId })
  }

  @Mutation(() => View)
  async createView(
    @Args('applicationId') applicationId: string,
    @Args('formId') formId: string,
    @Args('input') input: ViewInput
  ): Promise<View> {
    return this.formService.createView({ applicationId, formId, input })
  }

  @Mutation(() => View)
  async updateView(
    @Args('applicationId') applicationId: string,
    @Args('formId') formId: string,
    @Args('viewId') viewId: string,
    @Args('input') input: ViewInput
  ): Promise<View> {
    return this.formService.updateView({ applicationId, formId, viewId, input })
  }

  @Mutation(() => View)
  async deleteView(
    @Args('applicationId') applicationId: string,
    @Args('formId') formId: string,
    @Args('viewId') viewId: string
  ): Promise<View> {
    return this.formService.deleteView({ applicationId, formId, viewId })
  }
}

@ObjectType()
export class FormConnection extends Connection<Form> {
  constructor({
    orderBy,
    ...options
  }: Omit<ConnectionOptions<Form>, 'orderBy'> & { orderBy?: FormOrder }) {
    super({
      ...options,
      orderBy: orderBy && {
        field: (
          {
            [FormOrderField.CREATED_AT]: 'createdAt',
            [FormOrderField.UPDATED_AT]: 'updatedAt',
          } as const
        )[orderBy.field],
        direction: orderBy.direction,
      },
    })
  }

  @Field(() => [Form])
  override get nodes(): Promise<Form[]> {
    return super.nodes
  }

  @Field(() => [FormEdge])
  override get edges(): Promise<FormEdge[]> {
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
export class FormEdge {
  @Field(() => String)
  cursor!: string

  @Field(() => Form)
  node!: Form
}
