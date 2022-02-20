import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createHash, createPublicKey } from 'crypto'
import { exportJWK, importSPKI } from 'jose'
import { Algorithm, sign, SignOptions, verify } from 'jsonwebtoken'

@Injectable()
export class Config {
  constructor(private readonly configService: ConfigService) {}

  get port() {
    return this.getNumber('port')
  }

  get cors() {
    return this.getBoolean('cors')
  }

  get mongo() {
    const config = this

    return {
      get uri() {
        return config.getString('mongo.uri')
      },
    }
  }

  get accessToken() {
    const config = this

    return {
      get id() {
        return createHash('md5').update(this.privateKey).digest('base64')
      },
      get issuer() {
        return config.get('accessToken.issuer')
      },
      get audience() {
        return config.get('accessToken.audience')
      },
      get algorithm(): Algorithm {
        const alg = config.get('accessToken.algorithm')
        if (!isAlgorithm(alg)) {
          throw new Error('Invalid accessToken algorithm')
        }
        return alg
      },
      get privateKey() {
        return config.getString('accessToken.privateKey')
      },
      get publicKey() {
        return createPublicKey(this.privateKey).export({ format: 'pem', type: 'spki' }).toString()
      },
      get expiresIn() {
        return config.getNumber('accessToken.expiresIn')
      },
      sign(
        payload: string | Buffer | object,
        options?: Omit<SignOptions, 'algorithm' | 'expiresIn' | 'issuer' | 'audience' | 'keyid'>
      ) {
        return sign(payload, this.privateKey, {
          ...options,
          algorithm: this.algorithm,
          expiresIn: this.expiresIn,
          issuer: this.issuer,
          audience: this.audience,
          keyid: this.id,
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

  get refreshToken() {
    const config = this

    return {
      get id() {
        return createHash('md5').update(this.privateKey).digest('base64')
      },
      get issuer() {
        return config.get('refreshToken.issuer')
      },
      get audience() {
        return config.get('refreshToken.audience')
      },
      get algorithm(): Algorithm {
        const alg = config.get('refreshToken.algorithm')
        if (!isAlgorithm(alg)) {
          throw new Error('Invalid refreshToken algorithm')
        }
        return alg
      },

      get privateKey() {
        return config.getString('refreshToken.privateKey')
      },
      get publicKey() {
        return createPublicKey(this.privateKey).export({ format: 'pem', type: 'spki' }).toString()
      },
      get expiresIn() {
        return config.getNumber('refreshToken.expiresIn')
      },
      sign(
        payload: string | Buffer | object,
        options?: Omit<SignOptions, 'algorithm' | 'expiresIn' | 'issuer' | 'audience' | 'keyid'>
      ) {
        return sign(payload, this.privateKey, {
          ...options,
          algorithm: this.algorithm,
          expiresIn: this.expiresIn,
          issuer: this.issuer,
          audience: this.audience,
          keyid: this.id,
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

  get dingtalk() {
    const config = this

    return {
      get clientId() {
        return config.getString('dingtalk.clientId')
      },
      get clientSecret() {
        return config.getString('dingtalk.clientSecret')
      },
    }
  }

  get zeebe() {
    const config = this

    return {
      gateway: {
        get address() {
          return config.getString('zeebe.gateway.address')
        },
      },
      tasklist: {
        accessToken: {
          get id() {
            return createHash('md5').update(this.privateKey).digest('base64')
          },
          get issuer() {
            return config.get('zeebe.tasklist.accessToken.issuer')
          },
          get audience() {
            return config.get('zeebe.tasklist.accessToken.audience')
          },
          get algorithm(): Algorithm {
            const alg = config.get('zeebe.tasklist.accessToken.algorithm')
            if (!isAlgorithm(alg)) {
              throw new Error('Invalid accessToken algorithm')
            }
            return alg
          },
          get privateKey() {
            return config.getString('zeebe.tasklist.accessToken.privateKey')
          },
          get publicKey() {
            return createPublicKey(this.privateKey)
              .export({ format: 'pem', type: 'spki' })
              .toString()
          },
          get expiresIn() {
            return config.getNumber('zeebe.tasklist.accessToken.expiresIn')
          },
          get jwk() {
            return importSPKI(this.publicKey, this.algorithm)
              .then(exportJWK)
              .then(jwk => ({
                kid: this.id,
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

  private get(key: string): string | undefined {
    return this.configService.get<string>(key) || undefined
  }

  private getString(key: string): string {
    const v = this.get(key)
    if (!v) {
      throw new Error(`Required config ${key} is missing`)
    }
    return v
  }

  private getNumber(key: string): number {
    const v = this.getString(key)
    return Number(v)
  }

  private getBoolean(key: string): boolean {
    return this.getString(key) === 'true'
  }
}

function isAlgorithm(v: any): v is Algorithm {
  return ['RS256', 'RS384', 'RS512'].includes(v)
}
