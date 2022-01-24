import { UseGuards } from '@nestjs/common'
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql'
import { AuthGuard } from '../auth/auth.guard'
import { Viewer } from '../auth/auth.schema'
import { CreateApplicationInput, UpdateApplicationInput } from './application.input'
import { Application } from './application.schema'
import { ApplicationService } from './application.service'

@Resolver(() => Application)
export class ApplicationResolver {
  constructor(private readonly applicationService: ApplicationService) {}

  @Query(() => [Application])
  @UseGuards(AuthGuard)
  async applications(@Context('viewer') viewer: Viewer): Promise<Application[]> {
    return this.applicationService.selectApplications(viewer.unionId)
  }

  @Query(() => Application)
  @UseGuards(AuthGuard)
  async application(
    @Context('viewer') viewer: Viewer,
    @Args('applicationId') appId: string
  ): Promise<Application> {
    const application = await this.applicationService.selectApplication(viewer.unionId, appId)
    if (!application) {
      throw new Error('Not Found')
    }
    return application
  }

  @Mutation(() => Application)
  @UseGuards(AuthGuard)
  async createApplication(
    @Context('viewer') viewer: Viewer,
    @Args('input') input: CreateApplicationInput
  ): Promise<Application> {
    return this.applicationService.createApplication(viewer.unionId, input)
  }

  @Mutation(() => Application)
  @UseGuards(AuthGuard)
  async updateApplication(
    @Context('viewer') viewer: Viewer,
    @Args('applicationId') appId: string,
    @Args('input') input: UpdateApplicationInput
  ): Promise<Application> {
    const application = await this.applicationService.updateApplication(
      viewer.unionId,
      appId,
      input
    )
    if (!application) {
      throw new Error('Not Found')
    }
    return application
  }

  @Mutation(() => Boolean)
  @UseGuards(AuthGuard)
  async deleteApplication(
    @Context('viewer') viewer: Viewer,
    @Args('applicationId') appId: string
  ): Promise<boolean> {
    const application = await this.applicationService.deleteApplication(viewer.unionId, appId)
    if (!application) {
      throw new Error('Not Found')
    }
    return true
  }
}
