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
import {
  Args,
  Field,
  Int,
  Mutation,
  ObjectType,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql'
import { GqlAuthGuard, CurrentUser } from '../../auth/gql-auth.guard'
import { Connection, ConnectionOptions, PageInfo } from '../../utils/Connection'
import {
  ApplicationOrder,
  ApplicationOrderField,
  CreateApplicationInput,
  UpdateApplicationInput,
} from '../inputs/application.input'
import {
  Application,
  ApplicationDepartment,
  ApplicationDistrict,
  ApplicationUser,
} from '../schemas/application.schema'
import { ApplicationService } from '../services/application.service'

@Resolver()
@UseGuards(GqlAuthGuard)
export class ApplicationResolver {
  constructor(private readonly applicationService: ApplicationService) {}

  @Query(() => ApplicationConnection)
  async applications(
    @CurrentUser() user: CurrentUser,
    @Args('before', { nullable: true }) before?: string,
    @Args('after', { nullable: true }) after?: string,
    @Args('first', { type: () => Int, nullable: true }) first?: number,
    @Args('last', { type: () => Int, nullable: true }) last?: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number,
    @Args('orderBy', { nullable: true }) orderBy?: ApplicationOrder
  ): Promise<ApplicationConnection> {
    return new ApplicationConnection({
      before,
      after,
      first,
      last,
      offset,
      orderBy,
      find: options => this.applicationService.find({ userId: user.id, ...options }),
      count: options => this.applicationService.count({ userId: user.id, ...options }),
    })
  }

  @Query(() => Application)
  async application(
    @CurrentUser() user: CurrentUser,
    @Args('applicationId') applicationId: string
  ): Promise<Application> {
    return this.applicationService.findOne({ userId: user.id, applicationId })
  }

  @Mutation(() => Application)
  async createApplication(
    @CurrentUser() user: CurrentUser,
    @Args('input') input: CreateApplicationInput
  ): Promise<Application> {
    return this.applicationService.create({ userId: user.id, input })
  }

  @Mutation(() => Application)
  async updateApplication(
    @CurrentUser() user: CurrentUser,
    @Args('applicationId') applicationId: string,
    @Args('input') input: UpdateApplicationInput
  ): Promise<Application> {
    return this.applicationService.update({ userId: user.id, applicationId, input })
  }

  @Mutation(() => Application)
  async deleteApplication(
    @CurrentUser() user: CurrentUser,
    @Args('applicationId') applicationId: string
  ): Promise<Application> {
    return this.applicationService.delete({ userId: user.id, applicationId })
  }
}

@Resolver(() => ApplicationUser)
@UseGuards(GqlAuthGuard)
export class ApplicationUserResolver {
  constructor(private readonly applicationService: ApplicationService) {}

  @ResolveField(() => ApplicationDepartment)
  async department(@Parent() user: ApplicationUser): Promise<ApplicationDepartment> {
    return this.applicationService.getDepartment({
      applicationId: user.applicationId,
      departmentId: user.departmentId,
    })
  }
}

@Resolver(() => ApplicationDepartment)
@UseGuards(GqlAuthGuard)
export class ApplicationDepartmentResolver {
  constructor(private readonly applicationService: ApplicationService) {}

  @Query(() => [ApplicationDepartment])
  async departments(
    @Args('applicationId') applicationId: string,
    @Args('departmentId', { nullable: true }) departmentId?: string,
    @Args('departmentIds', { type: () => [String], nullable: true }) departmentIds?: string[]
  ): Promise<ApplicationDepartment[]> {
    return this.applicationService.getDepartments({
      applicationId,
      departmentId,
      departmentIds,
    })
  }

  @Query(() => ApplicationDepartment)
  async department(
    @Args('applicationId') applicationId: string,
    @Args('departmentId') departmentId: string
  ): Promise<ApplicationDepartment> {
    return this.applicationService.getDepartment({
      applicationId,
      departmentId,
    })
  }

  @ResolveField(() => ApplicationDepartment, { nullable: true })
  async parent(@Parent() department: ApplicationDepartment): Promise<ApplicationDepartment | null> {
    if (!department.parentId) {
      return null
    }

    return this.applicationService.getDepartment({
      applicationId: department.applicationId,
      departmentId: department.parentId,
    })
  }

  @ResolveField(() => [ApplicationDepartment])
  async children(@Parent() department: ApplicationDepartment): Promise<ApplicationDepartment[]> {
    return this.applicationService.getDepartments({
      applicationId: department.applicationId,
      departmentId: department.id,
    })
  }

  @Query(() => [ApplicationUser], { name: 'users' })
  async queryUsers(
    @Args('applicationId') applicationId: string,
    @Args('departmentId', { nullable: true }) departmentId?: string,
    @Args('userIds', { type: () => [String], nullable: true }) userIds?: string[]
  ): Promise<ApplicationUser[]> {
    return this.applicationService.getUsers({
      applicationId,
      departmentId,
      userIds,
    })
  }

  @Query(() => ApplicationUser, { name: 'user' })
  async queryUser(
    @Args('applicationId') applicationId: string,
    @Args('userId') userId: string
  ): Promise<ApplicationUser> {
    return this.applicationService.getUser({
      applicationId,
      userId,
    })
  }

  @ResolveField(() => [ApplicationUser])
  async users(@Parent() department: ApplicationDepartment): Promise<ApplicationUser[]> {
    return this.applicationService.getUsers({
      applicationId: department.applicationId,
      departmentId: department.id,
    })
  }
}

@Resolver(() => ApplicationDistrict)
@UseGuards(GqlAuthGuard)
export class ApplicationDistrictResolver {
  constructor(private readonly applicationService: ApplicationService) {}

  @Query(() => [ApplicationDistrict])
  async districts(
    @Args('applicationId') applicationId: string,
    @Args('districtId', { nullable: true }) districtId?: string,
    @Args('districtIds', { type: () => [String], nullable: true }) districtIds?: string[]
  ): Promise<ApplicationDistrict[]> {
    return this.applicationService.getDistricts({
      applicationId,
      districtId,
      districtIds,
    })
  }

  @Query(() => ApplicationDistrict)
  async district(
    @Args('applicationId') applicationId: string,
    @Args('districtId') districtId: string
  ): Promise<ApplicationDistrict> {
    return this.applicationService.getDistrict({
      applicationId,
      districtId,
    })
  }

  @ResolveField(() => ApplicationDistrict, { nullable: true })
  async parent(@Parent() district: ApplicationDistrict): Promise<ApplicationDistrict | null> {
    if (!district.parentId) {
      return null
    }

    return this.applicationService.getDistrict({
      applicationId: district.applicationId,
      districtId: district.parentId,
    })
  }

  @ResolveField(() => [ApplicationDistrict])
  async children(@Parent() district: ApplicationDistrict): Promise<ApplicationDistrict[]> {
    return this.applicationService.getDistricts({
      applicationId: district.applicationId,
      districtId: district.id,
    })
  }
}

@ObjectType()
export class ApplicationConnection extends Connection<Application> {
  constructor({
    orderBy,
    ...options
  }: Omit<ConnectionOptions<Application>, 'orderBy'> & { orderBy?: ApplicationOrder }) {
    super({
      ...options,
      orderBy: orderBy && {
        field: (
          {
            [ApplicationOrderField.CREATED_AT]: 'createdAt',
            [ApplicationOrderField.UPDATED_AT]: 'updatedAt',
          } as const
        )[orderBy.field],
        direction: orderBy.direction,
      },
    })
  }

  @Field(() => [Application])
  override get nodes(): Promise<Application[]> {
    return super.nodes
  }

  @Field(() => [ApplicationEdge])
  override get edges(): Promise<ApplicationEdge[]> {
    return super.edges
  }

  @Field(() => PageInfo)
  override get pageInfo(): PageInfo {
    return super.pageInfo
  }

  @Field(() => Int)
  override get totalCount(): Promise<number> {
    return super.totalCount
  }
}

@ObjectType()
export class ApplicationEdge {
  @Field(() => String)
  cursor!: string

  @Field(() => Application)
  node!: Application
}
