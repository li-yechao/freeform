import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { ApplicationResolver } from './application.resolver'
import { Application, ApplicationSchema } from './application.schema'
import { ApplicationService } from './application.service'

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: Application.name, schema: ApplicationSchema }]),
  ],
  providers: [ApplicationResolver, ApplicationService],
})
export class ApplicationModule {}
