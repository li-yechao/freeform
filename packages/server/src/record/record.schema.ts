import { Field, ID, ObjectType } from '@nestjs/graphql'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { GraphQLJSONObject } from 'graphql-type-json'
import { Types } from 'mongoose'

@Schema()
@ObjectType({ description: 'record' })
export class Record {
  @Field(() => ID)
  id!: string

  @Prop({ required: true })
  owner!: string

  @Prop({ type: Types.ObjectId, required: true })
  form!: string

  @Prop({ required: true })
  @Field()
  createdAt!: number

  @Prop()
  @Field({ nullable: true })
  updatedAt?: number

  @Prop()
  deletedAt?: number

  @Prop({ type: Types.Map, required: true })
  @Field(() => GraphQLJSONObject)
  data!: { [key: string]: { value: any } }
}

export const RecordSchema = SchemaFactory.createForClass(Record)
