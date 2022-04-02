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
import { Node, Trigger } from '../schemas/workflow.schema'

@InputType()
export class CreateWorkflowInput {
  @Field({ nullable: true })
  name?: string

  @Field(() => GraphQLJSONObject)
  trigger?: Trigger

  @Field(() => [GraphQLJSONObject])
  children?: Node[]
}

@InputType()
export class UpdateWorkflowInput extends PartialType(
  PickType(CreateWorkflowInput, ['name', 'trigger', 'children'] as const)
) {}

@InputType()
export class WorkflowOrder {
  @Field(() => WorkflowOrderField)
  field!: WorkflowOrderField

  @Field(() => OrderDirection)
  direction!: OrderDirection
}

export enum WorkflowOrderField {
  CREATED_AT,
  UPDATED_AT,
}

registerEnumType(WorkflowOrderField, { name: 'WorkflowOrderField' })
