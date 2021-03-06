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
import { ConfigService } from '@nestjs/config'
import { createHash, createPublicKey } from 'crypto'
import { exportJWK, importSPKI } from 'jose'
import { Algorithm, sign, SignOptions, verify } from 'jsonwebtoken'

@Injectable()
export class Config {
  constructor(private readonly configService: ConfigService) {}

  get port() {
    return this.getInt('port', 8080)
  }

  get cors() {
    return this.getBoolean('cors', false)
  }

  get mongo() {
    return {
      uri: this.getString('mongo.uri'),
    }
  }

  private createTokenConfig(name: string) {
    return {
      get keyId() {
        return createHash('md5').update(this.privateKey).digest('base64')
      },
      issuer: this.get(`${name}.issuer`),
      audience: this.get(`${name}.audience`),
      algorithm: this.getEnum<Algorithm>(`${name}.algorithm`, ALGORITHMS, 'RS256'),
      privateKey: this.getString(`${name}.privateKey`),
      get publicKey() {
        return createPublicKey(this.privateKey).export({ format: 'pem', type: 'spki' }).toString()
      },
      expiresIn: this.getInt(`${name}.expiresIn`),
      sign(
        payload: string | Buffer | any,
        options?: Omit<SignOptions, 'algorithm' | 'expiresIn' | 'issuer' | 'audience' | 'keyid'>
      ) {
        return sign(payload, this.privateKey, {
          ...options,
          algorithm: this.algorithm,
          expiresIn: this.expiresIn,
          issuer: this.issuer,
          audience: this.audience,
          keyid: this.keyId,
        })
      },
      verify(token: string) {
        return verify(token, this.publicKey, {
          algorithms: [this.algorithm],
          issuer: this.issuer,
          audience: this.audience,
        })
      },
    }
  }

  get accessToken() {
    return this.createTokenConfig('accessToken')
  }

  get refreshToken() {
    return this.createTokenConfig('refreshToken')
  }

  get zeebe() {
    return {
      gateway: {
        address: this.getString('zeebe.gateway.address'),
      },
      tasklist: {
        accessToken: {
          get keyId() {
            return createHash('md5').update(this.privateKey).digest('base64')
          },
          issuer: this.get('zeebe.tasklist.accessToken.issuer'),
          audience: this.get('zeebe.tasklist.accessToken.audience'),
          algorithm: this.getEnum<Algorithm>(
            'zeebe.tasklist.accessToken.algorithm',
            ALGORITHMS,
            'RS256'
          ),
          privateKey: this.getString('zeebe.tasklist.accessToken.privateKey'),
          scope: this.getString('zeebe.tasklist.accessToken.scope'),
          get publicKey() {
            return createPublicKey(this.privateKey)
              .export({ format: 'pem', type: 'spki' })
              .toString()
          },
          expiresIn: this.getInt('zeebe.tasklist.accessToken.expiresIn'),
          get jwk() {
            return importSPKI(this.publicKey, this.algorithm)
              .then(exportJWK)
              .then(jwk => ({
                kid: this.keyId,
                use: 'sig',
                alg: this.algorithm,
                kty: jwk.kty!,
                n: jwk.n!,
                e: jwk.e!,
              }))
          },
        },
      },
    }
  }

  get dingtalk() {
    return {
      clientId: this.getString('dingtalk.clientId'),
      clientSecret: this.getString('dingtalk.clientSecret'),
    }
  }

  private get(key: string): string | undefined {
    return this.configService.get<string>(key)?.trim() || undefined
  }

  private getString(key: string, d?: string): string {
    const s = this.get(key)
    if (!s) {
      if (d !== undefined) {
        return d
      }
      throw new Error(`Missing required config \`${key}\``)
    }
    return s
  }

  private getEnum<T extends string>(key: string, enums: readonly T[], d?: T): T {
    const s = this.get(key)
    if (!s) {
      if (d !== undefined) {
        return d
      }
      throw new Error(`Missing required config \`${key}\``)
    }
    if (enums.includes(s as T)) {
      return s as T
    }
    throw new Error(
      `Invalid config \`${key}=${s}\`, expected: ${enums.map(e => `\`${e}\``).join(' ')}`
    )
  }

  private getInt(key: string, d?: number): number {
    const s = this.get(key)
    if (!s) {
      if (d !== undefined) {
        return d
      }
      throw new Error(`Missing required config \`${key}\``)
    }
    try {
      if (!/^\d+$/.test(s)) {
        throw new Error('Invalid number')
      }
      const n = parseInt(s)
      if (!Number.isSafeInteger(n)) {
        throw new Error('Invalid int')
      }
      return n
    } catch (error) {
      throw new Error(`Invalid config ${key}, require \`number\``)
    }
  }

  private getBoolean(key: string, d?: boolean): boolean {
    const s = this.get(key)
    if (!s) {
      if (d !== undefined) {
        return d
      }
      throw new Error(`Missing required config \`${key}\``)
    }
    if (s === 'true') {
      return true
    }
    if (s === 'false') {
      return false
    }
    throw new Error(`Invalid config ${key}, require \`true\` or \`false\``)
  }
}

const ALGORITHMS = ['RS256', 'RS384', 'RS512'] as const
