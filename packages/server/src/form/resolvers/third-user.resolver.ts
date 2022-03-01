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
import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql'
import { GqlAuthGuard } from '../../auth/gql-auth.guard'
import { ThirdDepartment, ThirdUser } from '../schemas/third-user.schema'
import { ThirdUserService } from '../services/third-user.service'

@Resolver(() => ThirdUser)
@UseGuards(GqlAuthGuard)
export class ThirdUserResolver {
  constructor(private readonly thirdUserService: ThirdUserService) {}

  @ResolveField(() => ThirdDepartment)
  async department(@Parent() user: ThirdUser): Promise<ThirdDepartment> {
    return this.thirdUserService.getDepartment({
      applicationId: user.applicationId,
      query: {
        departmentId: user.departmentId,
      },
    })
  }
}

@Resolver(() => ThirdDepartment)
@UseGuards(GqlAuthGuard)
export class ThirdDepartmentResolver {
  constructor(private readonly thirdUserService: ThirdUserService) {}

  @Query(() => [ThirdDepartment])
  async departments(
    @Args('applicationId') applicationId: string,
    @Args('departmentId', { nullable: true }) departmentId?: string,
    @Args('departmentIds', { type: () => [String], nullable: true }) departmentIds?: string[]
  ): Promise<ThirdDepartment[]> {
    return this.thirdUserService.getDepartments({
      applicationId,
      query: {
        departmentId,
        departmentIds,
      },
    })
  }

  @Query(() => ThirdDepartment)
  async department(
    @Args('applicationId') applicationId: string,
    @Args('departmentId') departmentId: string
  ): Promise<ThirdDepartment> {
    return this.thirdUserService.getDepartment({
      applicationId,
      query: {
        departmentId,
      },
    })
  }

  @ResolveField(() => ThirdDepartment, { nullable: true })
  async parent(@Parent() department: ThirdDepartment): Promise<ThirdDepartment | null> {
    if (!department.parentId) {
      return null
    }

    return this.thirdUserService.getDepartment({
      applicationId: department.applicationId,
      query: {
        departmentId: department.parentId,
      },
    })
  }

  @ResolveField(() => [ThirdDepartment])
  async children(@Parent() department: ThirdDepartment): Promise<ThirdDepartment[]> {
    return this.thirdUserService.getDepartments({
      applicationId: department.applicationId,
      query: {
        departmentId: department.id,
      },
    })
  }

  @Query(() => [ThirdUser], { name: 'users' })
  async queryUsers(
    @Args('applicationId') applicationId: string,
    @Args('departmentId', { nullable: true }) departmentId?: string,
    @Args('userIds', { type: () => [String], nullable: true }) userIds?: string[]
  ): Promise<ThirdUser[]> {
    return this.thirdUserService.getUsers({
      applicationId,
      query: {
        departmentId,
        userIds,
      },
    })
  }

  @Query(() => ThirdUser, { name: 'user' })
  async queryUser(
    @Args('applicationId') applicationId: string,
    @Args('userId') userId: string
  ): Promise<ThirdUser> {
    return this.thirdUserService.getUser({
      applicationId,
      query: {
        userId,
      },
    })
  }

  @ResolveField(() => [ThirdUser])
  async users(@Parent() department: ThirdDepartment): Promise<ThirdUser[]> {
    return this.thirdUserService.getUsers({
      applicationId: department.applicationId,
      query: {
        departmentId: department.id,
      },
    })
  }
}
