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
import { ModuleKind, ScriptTarget, transpileModule } from 'typescript'
import { NodeVM, VMScript } from 'vm2'
import { ZBClient, ZeebeJob } from 'zeebe-node'
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
        try {
          const script = CamundaService.cacheScript(job)

          const sandbox = Object.freeze({
            formTrigger: this.sandboxFormTrigger(job),
            application: this.sandboxApplication(job),
            outputs: this.sandboxOutputs(job),
          })

          const vm = new NodeVM({
            sandbox,
          })

          await this.runDefaultExportedFunction(vm, script)

          return job.complete(sandbox.outputs)
        } catch (error: any) {
          console.error(error)
          return job.error(error.name, error.message)
        }
      },
    })
  }

  private sandboxOutputs(_job: ZeebeJob<FormTriggerInputVariables>) {
    return new Proxy<{ [key: string | symbol]: any }>(
      {},
      {
        get: (t, p) => {
          return t[p]
        },
        set: (t, p, v) => {
          t[p] = v
          return true
        },
      }
    )
  }

  private sandboxFormTrigger(job: ZeebeJob<FormTriggerInputVariables>) {
    return new Proxy<{ viewerId: string; formId: string; record: Record }>({} as any, {
      get: (_, p) => {
        switch (p) {
          case 'viewerId':
            return job.variables.form_trigger_viewer_id
          case 'formId':
            return job.variables.form_trigger_form_id
          case 'record':
            return job.variables.form_trigger_record
        }
        return undefined
      },
    })
  }

  private sandboxApplication(job: ZeebeJob<FormTriggerInputVariables>) {
    return new Proxy<{}>({} as any, {
      get: (_, p) => {
        const m = p.toString().match(/^form_(?<formId>\S+)$/)
        const formId = m?.groups?.['formId']
        if (!formId) {
          return undefined
        }
        return this.sandboxForm({
          viewerId: job.variables.form_trigger_viewer_id,
          applicationId: job.variables.form_trigger_application_id,
          formId,
        })
      },
    })
  }

  private sandboxForm({
    viewerId,
    formId,
  }: {
    viewerId: string
    applicationId: string
    formId: string
  }) {
    return new Proxy({} as any, {
      get: (_, p) => {
        switch (p) {
          case 'id':
            return formId

          case 'fields':
            return new Proxy({}, { get: (_, p) => ({ id: p.toString() }) })

          case 'selectRecord':
            return ({ recordId }: { recordId: string }) => {
              return this.recordService.workflow_selectRecord({ formId, recordId })
            }

          case 'createRecord':
            return ({ data }: { data: { [key: string]: { value: any } } }) => {
              return this.recordService.workflow_createRecord({
                userId: viewerId,
                formId,
                data,
              })
            }

          case 'updateRecord':
            return ({
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
            }

          case 'deleteRecord':
            return ({ recordId }: { recordId: string }) => {
              return this.recordService.workflow_deleteRecord({
                formId,
                recordId,
              })
            }
        }

        return undefined
      },
    })
  }

  private async runDefaultExportedFunction(vm: NodeVM, script: VMScript) {
    const m = await vm.run(script)?.default
    if (typeof m === 'function') {
      return await m()
    }
    return m
  }

  private static scriptCache = new Map<string, VMScript>()

  private static cacheScript(job: ZeebeJob<unknown, { script: string }>): VMScript {
    const key = job.elementId

    let script = this.scriptCache.get(key)
    if (!script) {
      let source: string
      try {
        source = Buffer.from(job.customHeaders.script, 'base64').toString()
      } catch {
        throw new Error(`Invalid script in job custom headers`)
      }

      script = new VMScript(
        transpileModule(source, {
          compilerOptions: {
            module: ModuleKind.CommonJS,
            target: ScriptTarget.ESNext,
          },
        }).outputText
      )

      this.scriptCache.set(key, script)
    }
    return script
  }
}
