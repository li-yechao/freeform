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

    return verify(token, secret) as Viewer
  }
}
