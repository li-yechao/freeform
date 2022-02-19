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

import { forwardRef, Inject, Injectable } from '@nestjs/common'
import { VM } from 'vm2'
import { ZBClient } from 'zeebe-node'
import { Config } from '../../config'
import { Record } from '../schemas/record.schema'
import { RecordService } from './record.service'

interface FormTriggerInputVariables {
  form_trigger_viewer_id: string
  form_trigger_application_id: string
  form_trigger_form_id: string
  form_trigger_record: Record
  [key: string]: any
}

@Injectable()
export class CamundaService {
  constructor(
    config: Config,
    @Inject(forwardRef(() => RecordService))
    private readonly recordService: RecordService
  ) {
    this.zbClient = new ZBClient(config.zeebe.gateway.address)

    this.start()
  }

  private zbClient: ZBClient

  async deployProcess({ definition, name }: { definition: string; name: string }) {
    return this.zbClient.deployProcess({ definition: Buffer.from(definition), name })
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

  private start() {
    this.zbClient.createWorker<FormTriggerInputVariables, { script: string }>({
      taskType: 'script_js',
      taskHandler: async job => {
        let script: string
        try {
          script = Buffer.from(job.customHeaders.script, 'base64').toString()
        } catch {
          throw new Error(`Invalid script header`)
        }

        const formTrigger = {
          get viewerId() {
            const viewerId = job.variables.form_trigger_viewer_id
            if (!viewerId) {
              throw new Error(`Required variable form_trigger_viewer_id is missing`)
            }
            return viewerId
          },
          get formId() {
            const formId = job.variables.form_trigger_form_id
            if (!formId) {
              throw new Error(`Required variable form_trigger_form_id is missing`)
            }
            return formId
          },
          get record() {
            const record = job.variables.form_trigger_record
            if (!record) {
              throw new Error(`Required variable form_trigger_record is missing`)
            }
            return record
          },
        }

        const vm = new VM({
          sandbox: {
            formTrigger,
            application: new Proxy(
              {},
              {
                get: (_, p) => {
                  const m = p.toString().match(/^form_(?<formId>\S+)$/)
                  const formId = m?.groups?.['formId']
                  if (formId) {
                    return {
                      id: formId,
                      get fields() {
                        return new Proxy({}, { get: (_, p) => ({ id: p.toString() }) })
                      },
                      selectRecord: ({ recordId }: { recordId: string }) => {
                        return this.recordService.workflow_selectRecord({ formId, recordId })
                      },
                      createRecord: ({ data }: { data: { [key: string]: { value: any } } }) => {
                        return this.recordService.workflow_createRecord({
                          userId: formTrigger.viewerId,
                          formId,
                          data,
                        })
                      },
                      updateRecord: ({
                        recordId,
                        data,
                      }: {
                        recordId: string
                        data: { [key: string]: { value: any } }
                      }) => {
                        return this.recordService.workflow_updateRecord({
                          formId,
                          recordId,
                          data,
                        })
                      },
                      deleteRecord: ({ recordId }: { recordId: string }) => {
                        return this.recordService.workflow_deleteRecord({
                          formId,
                          recordId,
                        })
                      },
                    }
                  }
                  return undefined
                },
              }
            ),
          },
        })
        await vm.run(script)

        return job.complete()
      },
    })
  }
}
