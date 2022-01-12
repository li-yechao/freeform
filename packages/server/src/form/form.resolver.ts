import { UseGuards } from '@nestjs/common'
import { Args, Context, Mutation, Parent, ResolveField, Resolver } from '@nestjs/graphql'
import { Application } from 'src/application/application.schema'
import { AuthGuard } from 'src/auth/auth.guard'
import { Viewer } from 'src/auth/auth.schema'
import { CreateFormInput, UpdateFormInput } from './form.input'
import { Form } from './form.schema'
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
}
