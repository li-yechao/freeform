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

import { Field as GraphqlField, ID, ObjectType, registerEnumType } from '@nestjs/graphql'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { GraphQLJSONObject } from 'graphql-type-json'
import { Types } from 'mongoose'

export enum FieldState {
  READONLY,
  DISABLED,
}

registerEnumType(FieldState, { name: 'FieldState' })

@ObjectType({ description: 'field' })
export class Field {
  @Prop({ required: true })
  @GraphqlField()
  id!: string

  @Prop()
  @GraphqlField({ nullable: true })
  name?: string

  @Prop({ required: true })
  @GraphqlField()
  type!: string

  @Prop({ required: true })
  @GraphqlField()
  label!: string

  @Prop()
  @GraphqlField(() => FieldState, { nullable: true })
  state?: FieldState

  @Prop({ type: Types.Map })
  @GraphqlField(() => GraphQLJSONObject, { nullable: true })
  meta?: {}
}

@ObjectType()
export class Col {
  @Prop({ required: true })
  @GraphqlField()
  fieldId!: string
}

@ObjectType()
export class Row {
  @Prop([Col])
  @GraphqlField(() => [Col], { nullable: true })
  children?: Col[]
}

@ObjectType()
export class Layout {
  @Prop([Row])
  @GraphqlField(() => [Row], { nullable: true })
  rows?: Row[]
}

@ObjectType()
export class ViewField {
  @Prop({ required: true })
  @GraphqlField()
  fieldId!: string
}

@Schema()
@ObjectType()
export class View {
  @GraphqlField(() => ID)
  id!: string

  @Prop()
  @GraphqlField({ nullable: true })
  name?: string

  @Prop([ViewField])
  @GraphqlField(() => [ViewField], { nullable: true })
  fields?: ViewField[]
}

@Schema()
@ObjectType({ description: 'form' })
export class Form {
  @GraphqlField(() => ID)
  id!: string

  @Prop({ type: Types.ObjectId, required: true })
  application!: string

  @Prop({ required: true })
  @GraphqlField()
  createdAt!: number

  @Prop()
  @GraphqlField({ nullable: true })
  updatedAt?: number

  @Prop()
  deletedAt?: number

  @Prop()
  @GraphqlField({ nullable: true })
  name?: string

  @Prop()
  @GraphqlField({ nullable: true })
  description?: string

  @Prop([Field])
  @GraphqlField(() => [Field], { nullable: true })
  fields?: Field[]

  @Prop(Layout)
  @GraphqlField(() => Layout, { nullable: true })
  layout?: Layout

  @Prop([View])
  @GraphqlField(() => [View], { nullable: true })
  views?: View[]
}

export const FormSchema = SchemaFactory.createForClass(Form)
