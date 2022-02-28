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

import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { WorkflowLog } from '../schemas/workflow-log.schema'

@Injectable()
export class WorkflowLogService {
  constructor(
    @InjectModel(WorkflowLog.name) private readonly workflowLogModel: Model<WorkflowLog>
  ) {}

  async createWorkflowLog({
    userId,
    workflowId,
    type,
    content,
  }: {
    userId?: string
    workflowId: string
    type?: string
    content?: string
  }): Promise<WorkflowLog> {
    return this.workflowLogModel.create({
      workflowId,
      userId,
      createdAt: Date.now(),
      type,
      content,
    })
  }
}
