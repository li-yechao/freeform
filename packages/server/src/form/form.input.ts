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

import { InputType, Field, PickType, PartialType } from '@nestjs/graphql'
import { GraphQLJSONObject } from 'graphql-type-json'
import { FieldState } from './form.schema'

@InputType()
export class FieldInput {
  @Field()
  id!: string

  @Field({ nullable: true })
  name?: string

  @Field()
  type!: string

  @Field()
  label!: string

  @Field(() => FieldState, { nullable: true })
  state?: FieldState

  @Field(() => GraphQLJSONObject, { nullable: true })
  meta?: {}
}

@InputType()
export class ColInput {
  @Field()
  fieldId!: string
}

@InputType()
export class RowInput {
  @Field(() => [ColInput], { nullable: true })
  children?: ColInput[]
}

@InputType()
export class LayoutInput {
  @Field(() => [RowInput], { nullable: true })
  rows?: RowInput[]
}

@InputType()
export class ViewFieldInput {
  @Field()
  fieldId!: string
}

@InputType()
export class ViewInput {
  @Field({ nullable: true })
  name?: string

  @Field(() => [ViewFieldInput], { nullable: true })
  fields?: ViewFieldInput[]
}

@InputType()
export class CreateFormInput {
  @Field({ nullable: true })
  name?: string

  @Field({ nullable: true })
  description?: string

  @Field(() => [FieldInput], { nullable: true })
  fields?: FieldInput[]

  @Field(() => LayoutInput, { nullable: true })
  layout?: LayoutInput

  @Field(() => [ViewInput], { nullable: true })
  views?: ViewInput[]
}

@InputType()
export class UpdateFormInput extends PartialType(
  PickType(CreateFormInput, ['name', 'description', 'fields', 'layout', 'views'] as const)
) {}
