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

import { ConfigService } from '@nestjs/config'
import { Test } from '@nestjs/testing'
import { generateKeyPairSync } from 'crypto'
import { mongo } from 'mongoose'
import { Config } from '../config'
import { createMock, MockType } from '../jest.utils'
import { UserService } from '../user/user.service'
import { AuthService } from './auth.service'

describe('AuthService', () => {
  let authService: AuthService
  let userService: MockType<UserService>
  let config: Config
  let configService: MockType<ConfigService>
  let fetch: jest.Mock

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      providers: [
        AuthService,
        Config,
        { provide: UserService, useFactory: () => createMock() },
        { provide: ConfigService, useFactory: () => createMock() },
        { provide: 'FETCH', useValue: jest.fn() },
      ],
    }).compile()

    authService = moduleFixture.get(AuthService)
    userService = moduleFixture.get(UserService)
    config = moduleFixture.get(Config)
    configService = moduleFixture.get(ConfigService)
    fetch = moduleFixture.get('FETCH')
  })

  test('should return refreshed token', async () => {
    const userId = new mongo.ObjectId().toHexString()

    userService.findOne.mockReturnValueOnce({ id: userId })
    configService.get.mockImplementation(mockConfigServiceForAuth())

    const auth = authService['createToken'](userId)

    await expect(
      authService.authCustom('refreshToken', { refreshToken: auth.refreshToken })
    ).resolves.toMatchObject({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
      expiresIn: expect.any(Number),
      tokenType: 'Bearer',
    })
  })

  test('should return auth result by dingtalk', async () => {
    const userId = new mongo.ObjectId().toHexString()

    userService.createOrUpdate.mockReturnValueOnce({ id: userId })
    configService.get.mockImplementation(mockConfigServiceForAuth())

    fetch.mockReturnValueOnce(
      Promise.resolve({ json: () => Promise.resolve({ accessToken: 'dingtalk access token' }) })
    )
    fetch.mockReturnValueOnce(
      Promise.resolve({ json: () => Promise.resolve({ unionId: 'dingtalk union id' }) })
    )

    await expect(authService.authCustom('dingtalk', { code: '123' })).resolves.toMatchObject({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
      expiresIn: expect.any(Number),
      tokenType: 'Bearer',
    })

    expect(userService.createOrUpdate.mock.calls.at(0)?.at(0)).toMatchObject({
      thirdType: 'dingtalk',
      thirdId: `dingtalk union id@${config.dingtalk.clientId}`,
      thirdUser: { unionId: 'dingtalk union id' },
    })
  })

  function mockConfigServiceForAuth() {
    const accessTokenKey = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    }).privateKey.trim()

    const refreshTokenKey = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    }).privateKey.trim()

    return (key: string) => {
      return {
        'accessToken.issuer': 'https://freeform.yechao.xyz',
        'accessToken.audience': 'https://freeform.yechao.xyz',
        'accessToken.algorithm': 'RS256',
        'accessToken.privateKey': accessTokenKey,
        'accessToken.expiresIn': '86400',

        'refreshToken.issuer': 'https://freeform.yechao.xyz',
        'refreshToken.audience': 'https://freeform.yechao.xyz',
        'refreshToken.algorithm': 'RS256',
        'refreshToken.privateKey': refreshTokenKey,
        'refreshToken.expiresIn': '604800',

        'dingtalk.clientId': 'dingtalkClientId',
        'dingtalk.clientSecret': 'dingtalkClientSecret',
      }[key]
    }
  }
})
