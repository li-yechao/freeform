import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { Application, ApplicationSchema } from '../application/application.schema'
import { ApplicationService } from '../application/application.service'
import { FormResolver } from './form.resolver'
import { Form, FormSchema } from './form.schema'
import { FormService } from './form.service'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Application.name, schema: ApplicationSchema },
      { name: Form.name, schema: FormSchema },
    ]),
  ],
  providers: [ConfigService, ApplicationService, FormResolver, FormService],
})
export class FormModule {}
