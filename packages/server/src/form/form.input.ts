import { InputType, Field, PickType, PartialType } from '@nestjs/graphql'

@InputType()
export class FieldInput {
  @Field()
  id!: string

  @Field({ nullable: true })
  name?: string

  @Field()
  type!: string
}

@InputType()
export class ColInput {
  @Field()
  fieldId!: string

  @Field({ nullable: true })
  span?: number
}

@InputType()
export class RowInput {
  @Field(() => [ColInput], { nullable: true })
  children?: ColInput[]

  @Field({ nullable: true })
  spacing?: number
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
