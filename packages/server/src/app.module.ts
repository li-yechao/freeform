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
import { ConfigModule, ConfigService } from '@nestjs/config'
import { GraphQLModule } from '@nestjs/graphql'
import { MongooseModule } from '@nestjs/mongoose'
import { ApplicationModule } from './application/application.module'
import { AuthModule } from './auth/auth.module'
import { FormModule } from './form/form.module'
import { RecordModule } from './record/record.module'
import { WorkflowModule } from './workflow/workflow.module'
import { CamundaModule } from './camunda/camunda.module'
import { UserModule } from './user/user.module'

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ['.env.local', '.env'] }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    GraphQLModule.forRoot({
      autoSchemaFile: true,
      context: ({ req }: any) => ({ headers: req.headers }),
    }),
    FormModule,
    AuthModule,
    ApplicationModule,
    RecordModule,
    WorkflowModule,
    CamundaModule,
    UserModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
