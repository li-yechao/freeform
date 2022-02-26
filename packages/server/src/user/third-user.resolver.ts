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
import { Viewer } from '../auth/auth.schema'
import { CurrentUser, GqlAuthGuard } from '../auth/gql-auth.guard'
import { ThirdDepartment, ThirdUser } from './third-user.schema'
import { ThirdUserService } from './third-user.service'
import { User } from './user.schema'
import { UserService } from './user.service'

@Resolver(() => ThirdUser)
@UseGuards(GqlAuthGuard)
export class ThirdUserResolver {
  constructor(
    private readonly userService: UserService,
    private readonly thirdUserService: ThirdUserService
  ) {}

  @ResolveField(() => ThirdDepartment)
  async department(
    @CurrentUser() viewer: Viewer,
    @Parent() user: ThirdUser
  ): Promise<ThirdDepartment> {
    const currentUser = await this.userService.selectUserById({ userId: viewer.id })
    if (!currentUser) {
      throw new Error(`Viewer is not found`)
    }

    return this.thirdUserService.getDepartment(thirdType(currentUser), thirdId(currentUser), {
      departmentId: user.departmentId,
    })
  }
}

@Resolver(() => ThirdDepartment)
@UseGuards(GqlAuthGuard)
export class ThirdDepartmentResolver {
  constructor(
    private readonly userService: UserService,
    private readonly thirdUserService: ThirdUserService
  ) {}

  @Query(() => [ThirdDepartment])
  async departments(
    @CurrentUser() viewer: Viewer,
    @Args('departmentId', { nullable: true }) departmentId?: string
  ): Promise<ThirdDepartment[]> {
    const user = await this.userService.selectUserById({ userId: viewer.id })
    if (!user) {
      throw new Error(`Viewer is not found`)
    }

    return this.thirdUserService.getDepartments(thirdType(user), thirdId(user), {
      departmentId,
    })
  }

  @Query(() => ThirdDepartment)
  async department(
    @CurrentUser() viewer: Viewer,
    @Args('departmentId') departmentId: string
  ): Promise<ThirdDepartment> {
    const user = await this.userService.selectUserById({ userId: viewer.id })
    if (!user) {
      throw new Error(`Viewer is not found`)
    }

    return this.thirdUserService.getDepartment(thirdType(user), thirdId(user), {
      departmentId,
    })
  }

  @ResolveField(() => [ThirdDepartment])
  async children(
    @CurrentUser() viewer: Viewer,
    @Parent() department: ThirdDepartment
  ): Promise<ThirdDepartment[]> {
    const user = await this.userService.selectUserById({ userId: viewer.id })
    if (!user) {
      throw new Error(`Viewer is not found`)
    }

    return this.thirdUserService.getDepartments(thirdType(user), thirdId(user), {
      departmentId: department.id,
    })
  }

  @ResolveField(() => [ThirdUser])
  async users(
    @CurrentUser() viewer: Viewer,
    @Parent() department: ThirdDepartment
  ): Promise<ThirdUser[]> {
    const user = await this.userService.selectUserById({ userId: viewer.id })
    if (!user) {
      throw new Error(`Viewer is not found`)
    }

    return this.thirdUserService.getDepartmentUsers(thirdType(user), thirdId(user), {
      departmentId: department.id,
    })
  }
}

function thirdType(user: User): string {
  if (!user.third) {
    throw new Error(`User property third is null`)
  }
  const keys = Object.keys(user.third)
  if (keys.length !== 1) {
    throw new Error(`Invalid user property third`)
  }
  return keys[0]!
}

function thirdId(user: User): string {
  return user.third![thirdType(user)].__id
}
