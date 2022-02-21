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

import { Injectable } from '@nestjs/common'
import fetch from 'cross-fetch'
import { existsSync } from 'fs'
import * as path from 'path'
import { NodeVM } from 'vm2'
import { Config } from '../config'
import { UserService } from '../user/user.service'
import { AuthResult } from './auth.schema'

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService, private readonly config: Config) {}

  async refreshToken(refreshToken: string): Promise<AuthResult> {
    const payload = this.config.refreshToken.verify(refreshToken)
    if (typeof payload.sub !== 'string' || !payload.sub) {
      throw new Error(`Invalid jwt token`)
    }

    const user = await this.userService.selectUserById({ userId: payload.sub })
    if (!user) {
      throw new Error(`User ${payload.sub} not found`)
    }

    return this.createToken(user.id)
  }

  async authCustom(type: string, query: { [key: string]: string }): Promise<AuthResult> {
    const file = path.join(process.cwd(), 'config', `third_${type}.js`)
    if (!existsSync(file)) {
      throw new Error(`Unsupported auth type ${type}`)
    }

    const vm = new NodeVM({
      sandbox: {
        fetch,
      },
      env: Object.entries(process.env)
        .filter(([key]) => key.startsWith(type))
        .reduce((res, [key, value]) => Object.assign(res, { [key]: value }), {}),
    })

    const m = vm.runFile(file)

    const { id: thirdId, user: thirdUser } = await m.getThirdUser(query)
    if (typeof thirdId !== 'string' || !thirdId) {
      throw new Error('Invalid thirdId')
    }

    const user =
      (await this.userService.selectThirdUser({ type, thirdId })) ||
      (await this.userService.createThirdUser({ type, thirdId, thirdUser }))
    return this.createToken(user.id)
  }

  private createToken(userId: string): AuthResult {
    return {
      accessToken: this.config.accessToken.sign({}, { subject: userId }),
      refreshToken: this.config.refreshToken.sign({}, { subject: userId }),
      expiresIn: this.config.accessToken.expiresIn,
      tokenType: 'Bearer',
    }
  }
}
