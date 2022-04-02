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
import { Config } from './config'

describe('Config', () => {
  let config: Config
  let configService: { get: jest.Mock }

  beforeEach(async () => {
    const mod = await Test.createTestingModule({
      providers: [Config, { provide: ConfigService, useFactory: () => ({ get: jest.fn() }) }],
    }).compile()

    config = mod.get(Config)
    configService = mod.get(ConfigService)
  })

  test('get', () => {
    configService.get.mockReturnValue(undefined)
    expect(config['get']('aaa')).toEqual(undefined)

    configService.get.mockReturnValue(null)
    expect(config['get']('aaa')).toEqual(undefined)

    configService.get.mockReturnValue('123')
    expect(config['get']('aaa')).toEqual('123')
  })

  test('getString', () => {
    configService.get.mockReturnValue(undefined)
    expect(() => config['getString']('aaa')).toThrow(/required/i)

    configService.get.mockReturnValue(null)
    expect(() => config['getString']('aaa')).toThrow(/required/i)

    configService.get.mockReturnValue(' ')
    expect(() => config['getString']('aaa')).toThrow(/required/i)

    configService.get.mockReturnValue(' ')
    expect(config['getString']('aaa', 'default')).toEqual('default')
  })

  test('getEnum', () => {
    configService.get.mockReturnValue('foo')
    expect(config['getEnum']('aaa', ['foo', 'bar'])).toEqual('foo')

    configService.get.mockReturnValue(undefined)
    expect(config['getEnum']('aaa', ['foo', 'bar'], 'foo')).toEqual('foo')

    configService.get.mockReturnValue(undefined)
    expect(() => config['getEnum']('aaa', ['foo', 'bar'])).toThrow(/required/i)

    configService.get.mockReturnValue('baz')
    expect(() => config['getEnum']('aaa', ['foo', 'bar'])).toThrow(/invalid/i)
  })

  test('getInt', () => {
    configService.get.mockReturnValue('123')
    expect(config['getInt']('aaa')).toEqual(123)

    configService.get.mockReturnValue(undefined)
    expect(() => config['getInt']('aaa')).toThrow(/required/i)

    configService.get.mockReturnValue('abc')
    expect(() => config['getInt']('aaa')).toThrow(/invalid/i)

    configService.get.mockReturnValue((Number.MAX_SAFE_INTEGER + 1).toString())
    expect(() => config['getInt']('aaa')).toThrow(/invalid/i)
  })

  test('getBoolean', () => {
    configService.get.mockReturnValue(undefined)
    expect(config['getBoolean']('aaa', true)).toEqual(true)

    configService.get.mockReturnValue(undefined)
    expect(config['getBoolean']('aaa', false)).toEqual(false)

    configService.get.mockReturnValue('true')
    expect(config['getBoolean']('aaa')).toEqual(true)

    configService.get.mockReturnValue('false')
    expect(config['getBoolean']('aaa')).toEqual(false)

    configService.get.mockReturnValue(undefined)
    expect(() => config['getBoolean']('aaa')).toThrow(/required/i)

    configService.get.mockReturnValue('abc')
    expect(() => config['getBoolean']('aaa')).toThrow(/invalid/i)

    configService.get.mockReturnValue('1')
    expect(() => config['getBoolean']('aaa')).toThrow(/invalid/i)

    configService.get.mockReturnValue('0')
    expect(() => config['getBoolean']('aaa')).toThrow(/invalid/i)
  })

  test('port', () => {
    // default `port`
    configService.get.mockReturnValueOnce(undefined)
    expect(config.port).toEqual(8080)

    // default `port`
    configService.get.mockReturnValueOnce(null)
    expect(config.port).toEqual(8080)

    // default `port`
    configService.get.mockReturnValueOnce('')
    expect(config.port).toEqual(8080)

    // default `port`
    configService.get.mockReturnValueOnce(' ')
    expect(config.port).toEqual(8080)

    configService.get.mockReturnValueOnce('8181')
    expect(config.port).toEqual(8181)

    configService.get.mockReturnValueOnce('abc')
    expect(() => config.port).toThrow(/invalid/i)
  })

  test('cors', () => {
    // default `cors`
    configService.get.mockReturnValueOnce(undefined)
    expect(config.cors).toEqual(false)

    configService.get.mockReturnValueOnce('false')
    expect(config.cors).toEqual(false)

    configService.get.mockReturnValueOnce('true')
    expect(config.cors).toEqual(true)
  })

  test('mongo', () => {
    configService.get.mockReturnValueOnce(undefined)
    expect(() => config.mongo.uri).toThrow(/required/i)

    configService.get.mockReturnValueOnce('mongo://a.a.a')
    expect(config.mongo.uri).toEqual('mongo://a.a.a')
  })

  test('accessToken', async () => {
    configService.get.mockReturnValue(undefined)
    expect(() => config.accessToken).toThrow(/required/i)

    const privateKey = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    }).privateKey.trim()

    configService.get.mockImplementation((key: string) => {
      return {
        issuer: 'https://issuer',
        audience: 'https://issuer',
        algorithm: 'RS256',
        privateKey,
        expiresIn: '86400',
      }[key.split('.').at(-1)!]
    })

    const accessToken = config.accessToken

    expect(accessToken).toMatchObject({
      issuer: 'https://issuer',
      audience: 'https://issuer',
      algorithm: 'RS256',
      privateKey,
      expiresIn: 86400,
    })
    const signature = accessToken.sign({ name: 'foo' })
    expect(accessToken.verify(signature)).toMatchObject({ name: 'foo' })

    expect(configService.get.mock.calls.map(i => i[0])).toMatchObject(
      new Array(configService.get.mock.calls.length).fill(expect.stringMatching(/^accessToken\./))
    )
  })

  test('refreshToken', async () => {
    configService.get.mockReturnValue(undefined)
    expect(() => config.refreshToken).toThrow(/required/i)

    const privateKey = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    }).privateKey.trim()

    configService.get.mockImplementation((key: string) => {
      return {
        issuer: 'https://issuer',
        audience: 'https://issuer',
        algorithm: 'RS256',
        privateKey,
        expiresIn: '86400',
      }[key.split('.').at(-1)!]
    })

    const refreshToken = config.refreshToken

    expect(refreshToken).toMatchObject({
      issuer: 'https://issuer',
      audience: 'https://issuer',
      algorithm: 'RS256',
      privateKey,
      expiresIn: 86400,
    })
    const signature = refreshToken.sign({ name: 'foo' })
    expect(refreshToken.verify(signature)).toMatchObject({ name: 'foo' })

    expect(configService.get.mock.calls.map(i => i[0])).toMatchObject(
      new Array(configService.get.mock.calls.length).fill(expect.stringMatching(/^refreshToken\./))
    )
  })

  test('zeebe', async () => {
    configService.get.mockReturnValue(undefined)
    expect(() => config.zeebe).toThrow(/required/i)

    const privateKey = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    }).privateKey.trim()

    configService.get.mockImplementation((key: string) => {
      return {
        'zeebe.gateway.address': '127.0.0.1:26500',
        'zeebe.tasklist.accessToken.expiresIn': '86400',
        'zeebe.tasklist.accessToken.algorithm': 'RS256',
        'zeebe.tasklist.accessToken.issuer': 'https://freeform.yechao.xyz',
        'zeebe.tasklist.accessToken.audience': 'camunda-tasklist.yechao.xyz',
        'zeebe.tasklist.accessToken.scope': '123456',
        'zeebe.tasklist.accessToken.privateKey': privateKey,
      }[key]
    })

    expect(config.zeebe).toMatchObject({
      gateway: { address: '127.0.0.1:26500' },
      tasklist: {
        accessToken: {
          expiresIn: 86400,
          algorithm: 'RS256',
          issuer: 'https://freeform.yechao.xyz',
          audience: 'camunda-tasklist.yechao.xyz',
          scope: '123456',
          privateKey,
        },
      },
    })
    expect(config.zeebe.tasklist.accessToken.jwk).resolves.toMatchObject({
      kid: expect.any(String),
      use: 'sig',
      alg: 'RS256',
      kty: expect.any(String),
      n: expect.any(String),
      e: expect.any(String),
    })
  })

  test('dingtalk', async () => {
    configService.get.mockReturnValue(undefined)
    expect(() => config.dingtalk).toThrow(/required/i)

    configService.get.mockImplementation((key: string) => {
      return {
        'dingtalk.clientId': '123456',
        'dingtalk.clientSecret': 'abcdefg',
      }[key]
    })
    expect(config.dingtalk).toMatchObject({
      clientId: '123456',
      clientSecret: 'abcdefg',
    })
  })
})
