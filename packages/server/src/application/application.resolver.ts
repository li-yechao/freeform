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
    return this.applicationService.selectApplications(viewer.id)
  }

  @Query(() => Application)
  @UseGuards(AuthGuard)
  async application(
    @Context('viewer') viewer: Viewer,
    @Args('applicationId') appId: string
  ): Promise<Application> {
    const application = await this.applicationService.selectApplication(viewer.id, appId)
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
    return this.applicationService.createApplication(viewer.id, input)
  }

  @Mutation(() => Application)
  @UseGuards(AuthGuard)
  async updateApplication(
    @Context('viewer') viewer: Viewer,
    @Args('applicationId') appId: string,
    @Args('input') input: UpdateApplicationInput
  ): Promise<Application> {
    const application = await this.applicationService.updateApplication(viewer.id, appId, input)
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
    const application = await this.applicationService.deleteApplication(viewer.id, appId)
    if (!application) {
      throw new Error('Not Found')
    }
    return true
  }
}
