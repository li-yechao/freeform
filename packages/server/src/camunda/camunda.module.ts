import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { Application, ApplicationSchema } from '../application/application.schema'
import { ApplicationService } from '../application/application.service'
import { Form, FormSchema } from '../form/form.schema'
import { FormService } from '../form/form.service'
import { Record, RecordSchema } from '../record/record.schema'
import { RecordService } from '../record/record.service'
import { Workflow, WorkflowSchema } from '../workflow/workflow.schema'
import { WorkflowService } from '../workflow/workflow.service'
import { CamundaService } from './camunda.service'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Application.name, schema: ApplicationSchema },
      { name: Form.name, schema: FormSchema },
      { name: Workflow.name, schema: WorkflowSchema },
      { name: Record.name, schema: RecordSchema },
    ]),
  ],
  providers: [
    ConfigService,
    ApplicationService,
    FormService,
    WorkflowService,
    RecordService,
    CamundaService,
  ],
})
export class CamundaModule {
  constructor(camundaService: CamundaService) {
    camundaService.start()
  }
}
