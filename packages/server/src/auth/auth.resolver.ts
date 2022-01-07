import { UseGuards } from '@nestjs/common'
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql'
import { AuthGuard } from './auth.guard'
import { AuthResult, Viewer } from './auth.schema'
import { AuthService } from './auth.service'

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Query(() => Viewer)
  @UseGuards(AuthGuard)
  async viewer(@Context('viewer') viewer: Viewer): Promise<Viewer> {
    return viewer
  }

  @Mutation(() => AuthResult)
  async authDingtalk(@Args('code') code: string): Promise<AuthResult> {
    return this.authService.authDingtalk(code)
  }
}
