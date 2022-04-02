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
import { ModuleKind, ScriptTarget, transpileModule } from 'typescript'
import { NodeVM, VMScript } from 'vm2'
import { ZBClient, ZeebeJob } from 'zeebe-node'
import { Record } from '../schemas/record.schema'
import { RecordService } from './record.service'
import { WorkflowLogService } from './workflow-log.service'

interface FormTriggerInputVariables {
  form_trigger_user_id: string
  form_trigger_application_id: string
  form_trigger_form_id: string
  form_trigger_record: Record
  [key: string]: any
}

@Injectable()
export class CamundaWorkerService {
  constructor(
    private readonly zbClient: ZBClient,
    private readonly recordService: RecordService,
    private readonly workflowLogService: WorkflowLogService
  ) {}

  start() {
    this.zbClient.createWorker<FormTriggerInputVariables, { script: string }>({
      taskType: 'script_js',
      taskHandler: this.handleScriptJsTask,
    })
  }

  private handleScriptJsTask = async (
    job: Pick<
      ZeebeJob<FormTriggerInputVariables, { script: string }>,
      'variables' | 'bpmnProcessId' | 'customHeaders' | 'elementId' | 'complete' | 'error'
    >
  ) => {
    const workflowId = job.bpmnProcessId.replace(/^process_/i, '')

    const sandbox = Object.freeze({
      formTrigger: this.sandboxFormTrigger(job),
      application: this.sandboxApplication(job),
      outputs: this.sandboxOutputs(),
    })

    try {
      const script = CamundaWorkerService.cacheScript(job)

      const vm = new NodeVM({
        console: 'redirect',
        sandbox,
      })

      vm.on('console.log', (...msg) => {
        this.workflowLogService.create({
          userId: sandbox.formTrigger.userId,
          workflowId,
          type: 'console.log',
          content: JSON.stringify(msg),
        })
      })

      await CamundaWorkerService.runDefaultExportedFunction(vm, script)

      return job.complete(sandbox.outputs)
    } catch (error: any) {
      this.workflowLogService.create({
        userId: sandbox.formTrigger.userId,
        workflowId,
        type: 'error',
        content: error.stack,
      })

      return job.error(error.name, error.message)
    }
  }

  private sandboxOutputs() {
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

  private sandboxFormTrigger(
    job: Pick<
      ZeebeJob<
        Pick<
          FormTriggerInputVariables,
          'form_trigger_user_id' | 'form_trigger_form_id' | 'form_trigger_record'
        >
      >,
      'variables'
    >
  ) {
    return new Proxy<{ userId: string; formId: string; record: Record }>({} as any, {
      get: (_, p) => {
        switch (p) {
          case 'userId':
            return job.variables.form_trigger_user_id
          case 'formId':
            return job.variables.form_trigger_form_id
          case 'record':
            return job.variables.form_trigger_record
        }
        return undefined
      },
    })
  }

  private sandboxApplication(
    job: Pick<
      ZeebeJob<
        Pick<FormTriggerInputVariables, 'form_trigger_user_id' | 'form_trigger_application_id'>
      >,
      'variables'
    >
  ) {
    return new Proxy<any>({} as any, {
      get: (_, p) => {
        const m = p.toString().match(/^form_(?<formId>\S+)$/)
        const formId = m?.groups?.['formId']
        if (!formId) {
          return undefined
        }
        return this.sandboxForm({
          userId: job.variables.form_trigger_user_id,
          applicationId: job.variables.form_trigger_application_id,
          formId,
        })
      },
    })
  }

  private sandboxForm({
    userId,
    formId,
  }: {
    userId: string
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

          case 'findOne':
            return async ({ recordId }: { recordId: string }) => {
              return this.recordService.findOne({ formId, recordId })
            }

          case 'create':
            return async ({ data }: { data: { [key: string]: { value: any } } }) => {
              return this.recordService.create({ userId, formId, input: { data } })
            }

          case 'update':
            return async ({
              recordId,
              data,
            }: {
              recordId: string
              data: { [key: string]: { value: any } }
            }) => {
              return this.recordService.update({
                userId,
                formId,
                recordId,
                input: { data },
              })
            }

          case 'delete':
            return async ({ recordId }: { recordId: string }) => {
              return this.recordService.delete({ userId, formId, recordId })
            }
        }

        return undefined
      },
    })
  }

  private static async runDefaultExportedFunction(vm: NodeVM, script: VMScript) {
    const m = await vm.run(script)?.default
    if (typeof m === 'function') {
      return await m()
    }
    return m
  }

  private static scriptCache = new Map<string, VMScript>()

  private static cacheScript(
    job: Pick<ZeebeJob<unknown, { script: string }>, 'elementId' | 'customHeaders'>
  ): VMScript {
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
