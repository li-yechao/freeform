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
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import { Viewer } from '../../auth/auth.schema'
import { CurrentUser, GqlAuthGuard } from '../../auth/gql-auth.guard'
import { CreateApplicationInput, UpdateApplicationInput } from '../inputs/application.input'
import { Application } from '../schemas/application.schema'
import { ApplicationService } from '../services/application.service'

@Resolver(() => Application)
@UseGuards(GqlAuthGuard)
export class ApplicationResolver {
  constructor(private readonly applicationService: ApplicationService) {}

  @Query(() => [Application])
  async applications(@CurrentUser() viewer: Viewer): Promise<Application[]> {
    return this.applicationService.selectApplications(viewer.id)
  }

  @Query(() => Application)
  async application(
    @CurrentUser() viewer: Viewer,
    @Args('applicationId') applicationId: string
  ): Promise<Application> {
    const application = await this.applicationService.selectApplication(viewer.id, applicationId)
    if (!application) {
      throw new Error('Not Found')
    }
    return application
  }

  @Mutation(() => Application)
  async createApplication(
    @CurrentUser() viewer: Viewer,
    @Args('input') input: CreateApplicationInput
  ): Promise<Application> {
    return this.applicationService.createApplication(viewer.id, input)
  }

  @Mutation(() => Application)
  async updateApplication(
    @CurrentUser() viewer: Viewer,
    @Args('applicationId') applicationId: string,
    @Args('input') input: UpdateApplicationInput
  ): Promise<Application> {
    const application = await this.applicationService.updateApplication(
      viewer.id,
      applicationId,
      input
    )
    if (!application) {
      throw new Error('Not Found')
    }
    return application
  }

  @Mutation(() => Boolean)
  async deleteApplication(
    @CurrentUser() viewer: Viewer,
    @Args('applicationId') applicationId: string
  ): Promise<boolean> {
    const application = await this.applicationService.deleteApplication(viewer.id, applicationId)
    if (!application) {
      throw new Error('Not Found')
    }
    return true
  }
}
