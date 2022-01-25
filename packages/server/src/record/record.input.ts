import { InputType, Field, PickType, PartialType } from '@nestjs/graphql'
import { GraphQLJSONObject } from 'graphql-type-json'

@InputType()
export class CreateRecordInput {
  @Field(() => GraphQLJSONObject)
  data!: { [key: string]: { value: any } }
}

@InputType()
export class UpdateRecordInput extends PartialType(
  PickType(CreateRecordInput, ['data'] as const)
) {}
