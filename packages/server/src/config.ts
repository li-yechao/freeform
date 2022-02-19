import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createPublicKey } from 'crypto'

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
        return config.get('mongo.uri')
      },
    }
  }

  get accessToken() {
    const config = this

    return {
      get privateKey() {
        return config.get('accessToken.privateKey')
      },
      get publicKey() {
        return createPublicKey(this.privateKey).export({ format: 'pem', type: 'spki' })
      },
      get expiresIn() {
        return config.getNumber('accessToken.expiresIn')
      },
    }
  }

  get refreshToken() {
    const config = this

    return {
      get privateKey() {
        return config.get('refreshToken.privateKey')
      },
      get publicKey() {
        return createPublicKey(this.privateKey).export({ format: 'pem', type: 'spki' })
      },
      get expiresIn() {
        return config.getNumber('refreshToken.expiresIn')
      },
    }
  }

  get dingtalk() {
    const config = this

    return {
      get clientId() {
        return config.get('dingtalk.clientId')
      },
      get clientSecret() {
        return config.get('dingtalk.clientSecret')
      },
    }
  }

  get zeebe() {
    const config = this

    return {
      gateway: {
        get address() {
          return config.get('zeebe.gateway.address')
        },
      },
    }
  }

  private get(key: string): string {
    const v = this.configService.get<string>(key)
    if (!v) {
      throw new Error(`Required config ${key} is missing`)
    }
    return v
  }

  private getNumber(key: string): number {
    const v = this.get(key)
    return Number(v)
  }

  private getBoolean(key: string): boolean {
    return this.get(key) === 'true'
  }
}
