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
import { sign } from 'jsonwebtoken'
import { UserService } from '../user/user.service'

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService
  ) {}

  async authDingtalk(code: string) {
    const secret = this.configService.get<string>('ACCESS_TOKEN_SECRET')
    if (!secret) {
      throw new Error('Required env ACCESS_TOKEN_SECRET is missing')
    }
    const expiresIn = parseInt(this.configService.get<string>('ACCESS_TOKEN_EXPIRES_IN')!)
    if (!expiresIn) {
      throw new Error('Required env ACCESS_TOKEN_EXPIRES_IN is invalid')
    }

    const clientId = this.configService.get<string>('DING_TALK_CLIENT_ID')
    const clientSecret = this.configService.get<string>('DING_TALK_CLIENT_SECRET')
    if (!clientId || !clientSecret) {
      throw new Error('Required env DING_TALK_CLIENT_ID or DING_TALK_CLIENT_SECRET is missing')
    }

    const config = new Config()
    config.protocol = 'https'
    config.regionId = 'central'

    const oauth2Client = new oauth2_1_0.default(config)

    const {
      body: { accessToken },
    } = await oauth2Client.getUserToken(
      new oauth2_1_0.GetUserTokenRequest({
        grantType: 'authorization_code',
        clientId,
        clientSecret,
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
        clientId,
        unionId: dingtalkUser.unionId,
      })) ||
      (await this.userService.createDingtalkUser({
        ...dingtalkUser,
        clientId,
        unionId: dingtalkUser.unionId,
      }))

    return {
      accessToken: sign({ sub: user.id, exp: Math.ceil(Date.now() / 1000) + expiresIn }, secret),
      expiresIn,
    }
  }
}
