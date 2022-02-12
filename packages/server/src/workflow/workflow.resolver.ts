import { UseGuards } from '@nestjs/common'
import { Args, Context, Mutation, Parent, ResolveField, Resolver } from '@nestjs/graphql'
import { Application } from '../application/application.schema'
import { AuthGuard } from '../auth/auth.guard'
import { Viewer } from '../auth/auth.schema'
import { CreateWorkflowInput, UpdateWorkflowInput } from './workflow.input'
import { Workflow } from './workflow.schema'
import { WorkflowService } from './workflow.service'

@Resolver(() => Application)
@UseGuards(AuthGuard)
export class WorkflowResolver {
  constructor(private readonly workflowService: WorkflowService) {}

  @ResolveField(() => [Workflow])
  async workflows(
    @Context('viewer') viewer: Viewer,
    @Parent() application: Application
  ): Promise<Workflow[]> {
    return this.workflowService.selectWorkflows(viewer.id, application.id)
  }

  @ResolveField(() => Workflow)
  async workflow(
    @Context('viewer') viewer: Viewer,
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
    @Context('viewer') viewer: Viewer,
    @Args('applicationId') applicationId: string,
    @Args('input') input: CreateWorkflowInput
  ): Promise<Workflow> {
    return this.workflowService.createWorkflow(viewer.id, applicationId, input)
  }

  @Mutation(() => Workflow)
  async updateWorkflow(
    @Context('viewer') viewer: Viewer,
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
    @Context('viewer') viewer: Viewer,
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
