import { Field, ID, ObjectType } from '@nestjs/graphql'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'

@ObjectType()
@Schema()
export class Application {
  @Field(() => ID)
  id!: string

  @Prop({ required: true })
  owner!: string

  @Field()
  @Prop({ required: true })
  createdAt!: number

  @Field({ nullable: true })
  @Prop()
  updatedAt?: number

  @Prop()
  deletedAt?: number

  @Field({ nullable: true })
  @Prop()
  name?: string
}

export const ApplicationSchema = SchemaFactory.createForClass(Application)
