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
import { Config } from '../config'
import { UserService } from '../user/user.service'
import { AuthResult } from './auth.schema'

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService, private readonly config: Config) {
    config
  }

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
    if (type !== 'dingtalk') {
      throw new Error(`Unsupported auth type ${type}`)
    }

    const { id: thirdId, user: thirdUser } = await this.authDingtalk(query)

    const user =
      (await this.userService.selectThirdUser({ type, thirdId })) ||
      (await this.userService.createThirdUser({ type, thirdId, thirdUser }))

    return this.createToken(user.id)
  }

  private async authDingtalk(query: { [key: string]: string }) {
    const code = query?.['code']
    if (!code) {
      throw new Error(`Invalid dingtalk code ${code}`)
    }

    const token = await fetch('https://api.dingtalk.com/v1.0/oauth2/userAccessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId: this.config.dingtalk.clientId,
        clientSecret: this.config.dingtalk.clientSecret,
        code,
        grantType: 'authorization_code',
      }),
    }).then(res => res.json())

    if (!token?.accessToken) {
      throw new Error(`Failed to call dingtalk api oauth2/userAccessToken`)
    }

    const user = await fetch('https://api.dingtalk.com/v1.0/contact/users/me', {
      method: 'GET',
      headers: {
        'x-acs-dingtalk-access-token': token.accessToken,
      },
    }).then(res => res.json())

    return {
      id: `${user.unionId}@${this.config.dingtalk.clientId}`,
      user,
    }
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
