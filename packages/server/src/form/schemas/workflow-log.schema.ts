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

import { Field, ID, ObjectType } from '@nestjs/graphql'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import * as mongoose from 'mongoose'

@Schema()
@ObjectType({ description: 'workflow log' })
export class WorkflowLog {
  @Field(() => ID)
  id!: string

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  workflowId!: string

  @Prop()
  userId?: string

  @Prop({ required: true })
  @Field()
  createdAt!: number

  @Prop()
  @Field({ nullable: true })
  type?: string

  @Prop()
  @Field({ nullable: true })
  content?: string
}

export const WorkflowLogSchema = SchemaFactory.createForClass(WorkflowLog)
