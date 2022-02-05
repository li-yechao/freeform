import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { Application, ApplicationSchema } from '../application/application.schema'
import { ApplicationService } from '../application/application.service'
import { Workflow, WorkflowSchema } from './workflow.schema'
import { WorkflowService } from './workflow.service'
import { WorkflowResolver } from './workflow.resolver'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Application.name, schema: ApplicationSchema },
      { name: Workflow.name, schema: WorkflowSchema },
    ]),
  ],
  providers: [ConfigService, ApplicationService, WorkflowService, WorkflowResolver],
})
export class WorkflowModule {}
