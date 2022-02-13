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

import { contact_1_0, oauth2_1_0 } from '@alicloud/dingtalk'
import { Config } from '@alicloud/openapi-client'
import { RuntimeOptions } from '@alicloud/tea-util'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { sign, verify } from 'jsonwebtoken'
import { UserService } from '../user/user.service'
import { AuthResult } from './auth.schema'

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService
  ) {
    const accessTokenSecret = this.configService.get<string>('ACCESS_TOKEN_SECRET')
    if (!accessTokenSecret) {
      throw new Error('Required env ACCESS_TOKEN_SECRET is missing')
    }
    const accessTokenExpiresIn = parseInt(
      this.configService.get<string>('ACCESS_TOKEN_EXPIRES_IN')!
    )
    if (!accessTokenExpiresIn) {
      throw new Error('Required env ACCESS_TOKEN_EXPIRES_IN is invalid')
    }

    const refreshTokenSecret = this.configService.get<string>('REFRESH_TOKEN_SECRET')
    if (!refreshTokenSecret) {
      throw new Error('Required env REFRESH_TOKEN_SECRET is missing')
    }
    const refreshTokenExpiresIn = parseInt(
      this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN')!
    )
    if (!refreshTokenExpiresIn) {
      throw new Error('Required env REFRESH_TOKEN_EXPIRES_IN is invalid')
    }

    const dingtalkClientId = this.configService.get<string>('DING_TALK_CLIENT_ID')
    const dingtalkClientSecret = this.configService.get<string>('DING_TALK_CLIENT_SECRET')
    if (!dingtalkClientId || !dingtalkClientSecret) {
      throw new Error('Required env DING_TALK_CLIENT_ID or DING_TALK_CLIENT_SECRET is missing')
    }

    this.config = {
      accessToken: { secret: accessTokenSecret, expiresIn: accessTokenExpiresIn },
      refreshToken: { secret: refreshTokenSecret, expiresIn: refreshTokenExpiresIn },
      dingtalk: { clientId: dingtalkClientId, clientSecret: dingtalkClientSecret },
    }
  }

  private config: {
    accessToken: { secret: string; expiresIn: number }
    refreshToken: { secret: string; expiresIn: number }
    dingtalk: { clientId: string; clientSecret: string }
  }

  async authDingtalk(code: string): Promise<AuthResult> {
    const config = new Config()
    config.protocol = 'https'
    config.regionId = 'central'

    const oauth2Client = new oauth2_1_0.default(config)

    const {
      body: { accessToken },
    } = await oauth2Client.getUserToken(
      new oauth2_1_0.GetUserTokenRequest({
        grantType: 'authorization_code',
        clientId: this.config.dingtalk.clientId,
        clientSecret: this.config.dingtalk.clientSecret,
        code,
      })
    )

    const contactClient = new contact_1_0.default(config)

    const headers = new contact_1_0.GetUserHeaders()
    headers.commonHeaders = { 'x-acs-dingtalk-access-token': accessToken! }

    const { body: dingtalkUser } = await contactClient.getUserWithOptions(
      'me',
      headers,
      new RuntimeOptions()
    )

    if (!dingtalkUser.unionId) {
      throw new Error(`Missing required property unionId in dingtalk user`)
    }

    const user =
      (await this.userService.selectUserByDingtalkUnionId({
        clientId: this.config.dingtalk.clientId,
        unionId: dingtalkUser.unionId,
      })) ||
      (await this.userService.createDingtalkUser({
        ...dingtalkUser,
        clientId: this.config.dingtalk.clientId,
        unionId: dingtalkUser.unionId,
      }))

    return this.createToken(user.id)
  }

  async refreshToken(refreshToken: string): Promise<AuthResult> {
    const payload = verify(refreshToken, this.config.refreshToken.secret)
    if (typeof payload.sub !== 'string' || !payload.sub) {
      throw new Error(`Invalid jwt token`)
    }

    const user = await this.userService.selectUserById({ userId: payload.sub })
    if (!user) {
      throw new Error(`User ${payload.sub} not found`)
    }

    return this.createToken(user.id)
  }

  private createToken(userId: string): AuthResult {
    return {
      accessToken: sign({}, this.config.accessToken.secret, {
        subject: userId,
        expiresIn: this.config.accessToken.expiresIn,
      }),
      refreshToken: sign({}, this.config.refreshToken.secret, {
        subject: userId,
        expiresIn: this.config.refreshToken.expiresIn,
      }),
      expiresIn: this.config.accessToken.expiresIn,
    }
  }
}
