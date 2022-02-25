import { UseGuards } from '@nestjs/common'
import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql'
import { Viewer } from '../auth/auth.schema'
import { CurrentUser, GqlAuthGuard } from '../auth/gql-auth.guard'
import { ThirdDepartment } from './third-user.schema'
import { ThirdUserService } from './third-user.service'
import { User } from './user.schema'
import { UserService } from './user.service'

@Resolver(() => ThirdDepartment)
@UseGuards(GqlAuthGuard)
export class ThirdUserResolver {
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
