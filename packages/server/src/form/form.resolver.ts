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
import { Args, Context, Mutation, Parent, ResolveField, Resolver } from '@nestjs/graphql'
import { Application } from '../application/application.schema'
import { AuthGuard } from '../auth/auth.guard'
import { Viewer } from '../auth/auth.schema'
import { CreateFormInput, UpdateFormInput, ViewInput } from './form.input'
import { Form, View } from './form.schema'
import { FormService } from './form.service'

@Resolver(() => Application)
@UseGuards(AuthGuard)
export class FormResolver {
  constructor(private readonly formService: FormService) {}

  @ResolveField(() => [Form])
  async forms(
    @Context('viewer') viewer: Viewer,
    @Parent() application: Application
  ): Promise<Form[]> {
    return this.formService.selectForms(viewer.unionId, application.id)
  }

  @ResolveField(() => Form)
  async form(
    @Context('viewer') viewer: Viewer,
    @Parent() application: Application,
    @Args('formId') formId: string
  ): Promise<Form> {
    const form = await this.formService.selectForm(viewer.unionId, application.id, formId)
    if (!form) {
      throw new Error('Not found')
    }
    return form
  }

  @Mutation(() => Form)
  async createForm(
    @Context('viewer') viewer: Viewer,
    @Args('applicationId') appId: string,
    @Args('input') input: CreateFormInput
  ): Promise<Form> {
    return await this.formService.createForm(viewer.unionId, appId, input)
  }

  @Mutation(() => Form)
  async updateForm(
    @Context('viewer') viewer: Viewer,
    @Args('applicationId') appId: string,
    @Args('formId') formId: string,
    @Args('input') input: UpdateFormInput
  ): Promise<Form> {
    const form = await this.formService.updateForm(viewer.unionId, appId, formId, input)
    if (!form) {
      throw new Error('Not found')
    }
    return form
  }

  @Mutation(() => Boolean)
  async deleteForm(
    @Context('viewer') viewer: Viewer,
    @Args('applicationId') appId: string,
    @Args('formId') formId: string
  ) {
    const form = await this.formService.deleteForm(viewer.unionId, appId, formId)
    if (!form) {
      throw new Error('Not found')
    }
    return true
  }

  @Mutation(() => View)
  async createView(
    @Context('viewer') viewer: Viewer,
    @Args('applicationId') appId: string,
    @Args('formId') formId: string,
    @Args('input') input: ViewInput
  ): Promise<View> {
    return await this.formService.createView(viewer.unionId, appId, formId, input)
  }

  @Mutation(() => View)
  async updateView(
    @Context('viewer') viewer: Viewer,
    @Args('applicationId') appId: string,
    @Args('formId') formId: string,
    @Args('viewId') viewId: string,
    @Args('input') input: ViewInput
  ): Promise<View> {
    const view = await this.formService.updateView(viewer.unionId, appId, formId, viewId, input)
    if (!view) {
      throw new Error('Not found')
    }
    return view
  }

  @Mutation(() => Boolean)
  async deleteView(
    @Context('viewer') viewer: Viewer,
    @Args('applicationId') appId: string,
    @Args('formId') formId: string,
    @Args('viewId') viewId: string
  ): Promise<boolean> {
    const form = await this.formService.deleteView(viewer.unionId, appId, formId, viewId)
    if (!form) {
      throw new Error('Not found')
    }
    return true
  }
}
