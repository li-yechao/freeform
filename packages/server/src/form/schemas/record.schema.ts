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
import * as mongoose from 'mongoose'

@Schema()
@ObjectType({ description: 'record' })
export class Record {
  @Field(() => ID)
  id!: string

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  userId!: string

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  formId!: string

  @Prop({ required: true })
  @Field()
  createdAt!: number

  @Prop()
  @Field({ nullable: true })
  updatedAt?: number

  @Prop()
  deletedAt?: number

  @Prop({ type: mongoose.Schema.Types.Mixed })
  @Field(() => GraphQLJSONObject, { nullable: true })
  data?: { [key: string]: { value: any } }
}

export const RecordSchema = SchemaFactory.createForClass(Record)
