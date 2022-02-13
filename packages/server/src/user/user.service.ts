import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { User } from './user.schema'

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

  async selectUserById({ userId }: { userId: string }): Promise<User | null> {
    return this.userModel.findById(userId)
  }

  async selectUserByDingtalkUnionId({
    clientId,
    unionId,
  }: {
    clientId: string
    unionId: string
  }): Promise<User | null> {
    return this.userModel.findOne({
      'third.dingtalk.clientId': clientId,
      'third.dingtalk.unionId': unionId,
    })
  }

  async createDingtalkUser({
    clientId,
    unionId,
    mobile,
    nick,
    openId,
    stateCode,
  }: {
    clientId: string
    unionId: string
    mobile?: string
    nick?: string
    openId?: string
    stateCode?: string
  }): Promise<User> {
    return this.userModel.create({
      createdAt: Date.now(),
      third: {
        dingtalk: {
          clientId,
          unionId,
          mobile,
          nick,
          openId,
          stateCode,
        },
      },
    })
  }
}
