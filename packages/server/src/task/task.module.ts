import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { Config } from '../config'
import { TaskService } from './task.service'

@Module({
  imports: [ConfigModule],
  providers: [Config, TaskService],
})
export class TaskModule {}
