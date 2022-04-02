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
import { GraphQLJSONObject } from 'graphql-type-json'
import { AuthResult, Viewer } from './auth.schema'
import { AuthService } from './auth.service'
import { CurrentUser, GqlAuthGuard } from './gql-auth.guard'

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Query(() => Viewer)
  @UseGuards(GqlAuthGuard)
  async viewer(@CurrentUser() user: CurrentUser): Promise<Viewer> {
    return user
  }

  @Mutation(() => AuthResult)
  async auth(
    @Args('type') type: string,
    @Args('input', { type: () => GraphQLJSONObject }) input: any
  ): Promise<AuthResult> {
    return this.authService.authCustom(type, input)
  }
}
