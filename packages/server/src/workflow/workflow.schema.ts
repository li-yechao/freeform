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
import { GraphQLJSONObject } from 'graphql-type-json'
import { Types } from 'mongoose'

@Schema()
@ObjectType({ description: 'workflow' })
export class Workflow {
  @Field(() => ID)
  id!: string

  @Prop({ type: Types.ObjectId, required: true })
  application!: string

  @Prop({ required: true })
  @Field()
  createdAt!: number

  @Prop()
  @Field({ nullable: true })
  updatedAt?: number

  @Prop()
  deletedAt?: number

  @Prop()
  @Field({ nullable: true })
  name?: string

  @Prop({ type: Types.Map, required: true })
  @Field(() => GraphQLJSONObject)
  trigger!: Trigger

  @Prop({ type: Types.DocumentArray, required: true })
  @Field(() => [GraphQLJSONObject])
  children!: Node[]
}

export type Trigger = FormTrigger

export interface FormTrigger {
  id: string
  type: 'form_trigger'
  formId?: string
  actions?: FormTriggerAction[]
}

export type FormTriggerAction = { type: 'create' }

export type Node = ScriptJsNode

export interface ScriptJsNode {
  id: string
  type: 'script_js'
  script?: string
}

export const WorkflowSchema = SchemaFactory.createForClass(Workflow)
