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

import { InputType, Field, PickType, PartialType, registerEnumType } from '@nestjs/graphql'
import { GraphQLJSONObject } from 'graphql-type-json'
import { OrderDirection } from '../../utils/OrderDirection'

@InputType()
export class CreateRecordInput {
  @Field(() => GraphQLJSONObject)
  data!: { [key: string]: { value: any } }
}

@InputType()
export class UpdateRecordInput extends PartialType(
  PickType(CreateRecordInput, ['data'] as const)
) {}

@InputType()
export class RecordOrder {
  @Field(() => RecordOrderField)
  field!: RecordOrderField

  @Field(() => OrderDirection)
  direction!: OrderDirection
}

export enum RecordOrderField {
  CREATED_AT,
  UPDATED_AT,
}

registerEnumType(RecordOrderField, { name: 'RecordOrderField' })
