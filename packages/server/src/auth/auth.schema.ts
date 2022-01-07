import { Field as GraphqlField, ObjectType } from '@nestjs/graphql'

@ObjectType({ description: 'auth' })
export class AuthResult {
  @GraphqlField()
  accessToken!: string

  @GraphqlField()
  expiresIn!: number
}

@ObjectType({ description: 'viewer' })
export class Viewer {
  @GraphqlField()
  nick!: string

  @GraphqlField()
  openId!: string

  @GraphqlField()
  unionId!: string
}
