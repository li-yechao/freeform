import { InputType, Field, PartialType, PickType } from '@nestjs/graphql'

@InputType()
export class CreateApplicationInput {
  @Field({ nullable: true })
  name?: string
}

@InputType()
export class UpdateApplicationInput extends PartialType(
  PickType(CreateApplicationInput, ['name'] as const)
) {}
