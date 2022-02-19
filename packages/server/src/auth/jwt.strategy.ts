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
import { PassportStrategy } from '@nestjs/passport'
import { createPublicKey } from 'crypto'
import { ExtractJwt, Strategy } from 'passport-jwt'

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const privateKey = configService.get<string>('ACCESS_TOKEN_PRIVATE_KEY')
    if (!privateKey) {
      throw new Error('Required config ACCESS_TOKEN_PRIVATE_KEY is missing')
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: createPublicKey(privateKey).export({ format: 'pem', type: 'spki' }),
    })
  }

  async validate(payload: any): Promise<{ id: string }> {
    return { id: payload.sub }
  }
}
