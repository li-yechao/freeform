import { contact_1_0, oauth2_1_0 } from '@alicloud/dingtalk'
import { Config } from '@alicloud/openapi-client'
import { RuntimeOptions } from '@alicloud/tea-util'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { sign } from 'jsonwebtoken'

@Injectable()
export class AuthService {
  constructor(private readonly configService: ConfigService) {}

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

    const { body: user } = await contactClient.getUserWithOptions(
      'me',
      headers,
      new RuntimeOptions()
    )

    return {
      accessToken: sign({ ...user, exp: Math.ceil(Date.now() / 1000) + expiresIn }, secret),
      expiresIn,
    }
  }
}