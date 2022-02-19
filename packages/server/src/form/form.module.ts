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

import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { Config } from '../config'
import { ApplicationResolver } from './resolvers/application.resolver'
import { FormResolver } from './resolvers/form.resolver'
import { RecordResolver } from './resolvers/record.resolver'
import { WorkflowResolver } from './resolvers/workflow.resolver'
import { Application, ApplicationSchema } from './schemas/application.schema'
import { Form, FormSchema } from './schemas/form.schema'
import { Record, RecordSchema } from './schemas/record.schema'
import { Workflow, WorkflowSchema } from './schemas/workflow.schema'
import { ApplicationService } from './services/application.service'
import { CamundaService } from './services/camunda.service'
import { FormService } from './services/form.service'
import { RecordService } from './services/record.service'
import { WorkflowService } from './services/workflow.service'

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Application.name, schema: ApplicationSchema },
      { name: Form.name, schema: FormSchema },
      { name: Record.name, schema: RecordSchema },
      { name: Workflow.name, schema: WorkflowSchema },
    ]),
  ],
  providers: [
    // Services
    Config,
    CamundaService,
    ApplicationService,
    FormService,
    RecordService,
    WorkflowService,

    // Resolvers
    ApplicationResolver,
    FormResolver,
    RecordResolver,
    WorkflowResolver,
  ],
})
export class FormModule {}
