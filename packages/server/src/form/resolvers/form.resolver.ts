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
import { CreateFormInput, UpdateFormInput, ViewInput } from '../inputs/form.input'
import { Application } from '../schemas/application.schema'
import { Form, View } from '../schemas/form.schema'
import { FormService } from '../services/form.service'

@Resolver(() => Application)
@UseGuards(GqlAuthGuard)
export class FormResolver {
  constructor(private readonly formService: FormService) {}

  @ResolveField(() => [Form])
  async forms(@Parent() application: Application): Promise<Form[]> {
    return this.formService.findAllByApplicationId({ applicationId: application.id })
  }

  @ResolveField(() => Form)
  async form(@Args('formId') formId: string): Promise<Form> {
    return this.formService.findOne({ formId })
  }

  @Mutation(() => Form)
  async createForm(
    @Args('applicationId') applicationId: string,
    @Args('input') input: CreateFormInput
  ): Promise<Form> {
    return this.formService.create({ applicationId }, input)
  }

  @Mutation(() => Form)
  async updateForm(
    @Args('applicationId') _applicationId: string,
    @Args('formId') formId: string,
    @Args('input') input: UpdateFormInput
  ): Promise<Form> {
    return this.formService.update({ formId }, input)
  }

  @Mutation(() => Boolean)
  async deleteForm(@Args('applicationId') _applicationId: string, @Args('formId') formId: string) {
    return this.formService.delete({ formId })
  }

  @Mutation(() => View)
  async createView(
    @Args('applicationId') _applicationId: string,
    @Args('formId') formId: string,
    @Args('input') input: ViewInput
  ): Promise<View> {
    return this.formService.createView({ formId }, input)
  }

  @Mutation(() => View)
  async updateView(
    @Args('applicationId') _applicationId: string,
    @Args('formId') formId: string,
    @Args('viewId') viewId: string,
    @Args('input') input: ViewInput
  ): Promise<View> {
    return this.formService.updateView({ formId, viewId }, input)
  }

  @Mutation(() => Boolean)
  async deleteView(
    @Args('applicationId') _applicationId: string,
    @Args('formId') formId: string,
    @Args('viewId') viewId: string
  ): Promise<boolean> {
    await this.formService.deleteView({ formId, viewId })
    return true
  }
}
