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

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { GqlExecutionContext } from '@nestjs/graphql'
import { verify } from 'jsonwebtoken'
import { Observable } from 'rxjs'
import { Viewer } from './auth.schema'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const ctx = GqlExecutionContext.create(context).getContext()
    if (!ctx.headers.authorization) {
      return false
    }

    ctx.viewer = this.validateToken(ctx.headers.authorization)

    return true
  }

  validateToken(authorization: string): Viewer {
    const [type, token] = authorization.split(' ')
    if (!token || type !== 'Bearer') {
      throw new Error('Invalid authorization')
    }

    const secret = this.configService.get<string>('ACCESS_TOKEN_SECRET')
    if (!secret) {
      throw new Error('Required env ACCESS_TOKEN_SECRET is missing')
    }

    const payload = verify(token, secret)

    if (typeof payload.sub !== 'string' || !payload.sub) {
      throw new Error(`Invalid jwt token`)
    }

    return { id: payload.sub }
  }
}
