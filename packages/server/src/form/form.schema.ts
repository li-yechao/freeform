import { Field as GraphqlField, ID, ObjectType } from '@nestjs/graphql'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Application } from 'express'
import { Types } from 'mongoose'

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
}

@ObjectType()
export class Col {
  @Prop({ required: true })
  @GraphqlField()
  fieldId!: string

  @Prop()
  @GraphqlField({ nullable: true })
  span?: number
}

@ObjectType()
export class Row {
  @Prop([Col])
  @GraphqlField(() => [Col], { nullable: true })
  children?: Col[]

  @Prop()
  @GraphqlField({ nullable: true })
  spacing?: number
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

  @Prop({ required: true, type: Types.ObjectId, ref: 'Application' })
  application!: Application

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
