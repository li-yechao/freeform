import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthController } from './auth.controller'
import { AuthResolver } from './auth.resolver'
import { AuthService } from './auth.service'

@Module({
  imports: [ConfigModule],
  providers: [AuthResolver, AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
