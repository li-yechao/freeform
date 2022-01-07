import { Controller, Post, Query } from '@nestjs/common'
import { AuthResult } from './auth.schema'
import { AuthService } from './auth.service'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('dingtalk')
  async auth(@Query('code') code: string): Promise<AuthResult> {
    return this.authService.authDingtalk(code)
  }
}
