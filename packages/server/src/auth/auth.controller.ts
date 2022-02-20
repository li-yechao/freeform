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

import { Controller, Get, Post, Query } from '@nestjs/common'
import { Config } from '../config'
import { AuthResult } from './auth.schema'
import { AuthService } from './auth.service'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly config: Config) {}

  @Post('dingtalk')
  async auth(@Query('code') code: string): Promise<AuthResult> {
    return this.authService.authDingtalk(code)
  }

  @Post('refreshToken')
  async refreshToken(@Query('refreshToken') refreshToken: string): Promise<AuthResult> {
    return this.authService.refreshToken(refreshToken)
  }

  @Get('/camunda/tasklist/.well-known/jwks.json')
  async jwks() {
    return {
      keys: [await this.config.zeebe.tasklist.accessToken.jwk],
    }
  }
}
