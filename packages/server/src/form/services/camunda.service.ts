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
import { ZBClient } from 'zeebe-node'
import workflowToBpmn from '../camunda/workflowToBpmn'
import { Workflow } from '../schemas/workflow.schema'

@Injectable()
export class CamundaService {
  constructor(private readonly zbClient: ZBClient) {}

  async deployProcess({ workflow }: { workflow: Workflow }) {
    return this.zbClient.deployProcess({
      definition: Buffer.from(await workflowToBpmn(workflow)),
      name: workflow.id,
    })
  }

  async createProcessInstance({
    workflowId,
    variables,
  }: {
    workflowId: string
    variables: { [key: string]: any }
  }) {
    return this.zbClient.createProcessInstance(`Process_${workflowId}`, variables)
  }
}
