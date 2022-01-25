import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { Application, ApplicationSchema } from '../application/application.schema'
import { ApplicationService } from '../application/application.service'
import { Form, FormSchema } from '../form/form.schema'
import { FormService } from '../form/form.service'
import { RecordResolver } from './record.resolver'
import { Record, RecordSchema } from './record.schema'
import { RecordService } from './record.service'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Application.name, schema: ApplicationSchema },
      { name: Form.name, schema: FormSchema },
      { name: Record.name, schema: RecordSchema },
    ]),
  ],
  providers: [ConfigService, ApplicationService, FormService, RecordResolver, RecordService],
})
export class RecordModule {}
