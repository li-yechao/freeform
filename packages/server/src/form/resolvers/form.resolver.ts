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
import { CreateFormInput, UpdateFormInput, ViewInput } from '../inputs/form.input'
import { Application } from '../schemas/application.schema'
import { Form, View } from '../schemas/form.schema'
import { FormService } from '../services/form.service'

@Resolver(() => Application)
@UseGuards(GqlAuthGuard)
export class FormResolver {
  constructor(private readonly formService: FormService) {}

  @ResolveField(() => [Form])
  async forms(@CurrentUser() viewer: Viewer, @Parent() application: Application): Promise<Form[]> {
    return this.formService.selectForms(viewer.id, application.id)
  }

  @ResolveField(() => Form)
  async form(
    @CurrentUser() viewer: Viewer,
    @Parent() application: Application,
    @Args('formId') formId: string
  ): Promise<Form> {
    const form = await this.formService.selectForm(viewer.id, application.id, formId)
    if (!form) {
      throw new Error('Not found')
    }
    return form
  }

  @Mutation(() => Form)
  async createForm(
    @CurrentUser() viewer: Viewer,
    @Args('applicationId') applicationId: string,
    @Args('input') input: CreateFormInput
  ): Promise<Form> {
    return await this.formService.createForm(viewer.id, applicationId, input)
  }

  @Mutation(() => Form)
  async updateForm(
    @CurrentUser() viewer: Viewer,
    @Args('applicationId') applicationId: string,
    @Args('formId') formId: string,
    @Args('input') input: UpdateFormInput
  ): Promise<Form> {
    const form = await this.formService.updateForm(viewer.id, applicationId, formId, input)
    if (!form) {
      throw new Error('Not found')
    }
    return form
  }

  @Mutation(() => Boolean)
  async deleteForm(
    @CurrentUser() viewer: Viewer,
    @Args('applicationId') applicationId: string,
    @Args('formId') formId: string
  ) {
    const form = await this.formService.deleteForm(viewer.id, applicationId, formId)
    if (!form) {
      throw new Error('Not found')
    }
    return true
  }

  @Mutation(() => View)
  async createView(
    @CurrentUser() viewer: Viewer,
    @Args('applicationId') applicationId: string,
    @Args('formId') formId: string,
    @Args('input') input: ViewInput
  ): Promise<View> {
    return await this.formService.createView(viewer.id, applicationId, formId, input)
  }

  @Mutation(() => View)
  async updateView(
    @CurrentUser() viewer: Viewer,
    @Args('applicationId') applicationId: string,
    @Args('formId') formId: string,
    @Args('viewId') viewId: string,
    @Args('input') input: ViewInput
  ): Promise<View> {
    const view = await this.formService.updateView(viewer.id, applicationId, formId, viewId, input)
    if (!view) {
      throw new Error('Not found')
    }
    return view
  }

  @Mutation(() => Boolean)
  async deleteView(
    @CurrentUser() viewer: Viewer,
    @Args('applicationId') applicationId: string,
    @Args('formId') formId: string,
    @Args('viewId') viewId: string
  ): Promise<boolean> {
    const form = await this.formService.deleteView(viewer.id, applicationId, formId, viewId)
    if (!form) {
      throw new Error('Not found')
    }
    return true
  }
}
