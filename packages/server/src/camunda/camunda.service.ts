import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as camunda from 'camunda-external-task-client-js'
import { VM } from 'vm2'
import { RecordService } from '../record/record.service'

@Injectable()
export class CamundaService {
  constructor(configService: ConfigService, private readonly recordService: RecordService) {
    const camundaUri = configService.get<string>('CAMUNDA_URI')
    if (!camundaUri) {
      throw new Error('Required env CAMUNDA_URI is not present')
    }
    this.client = new camunda.Client({ baseUrl: camundaUri, use: camunda.logger })
  }

  private client: camunda.Client

  start() {
    this.client.subscribe('script_js', async e => {
      const script = e.task.variables.get(`${e.task.activityId}_script`)

      const viewerId = e.task.variables.get('form_trigger_viewer_id')
      if (!viewerId) {
        throw new Error(`Required variable form_trigger_viewer_id is missing`)
      }

      const applicationId = e.task.variables.get('form_trigger_application_id')
      if (!applicationId) {
        throw new Error(`Required variable form_trigger_application_id is missing`)
      }

      const formId = e.task.variables.get('form_trigger_form_id')
      if (!formId) {
        throw new Error(`Required variable form_trigger_form_id is missing`)
      }

      const record = e.task.variables.get('form_trigger_record')

      const vm = new VM({
        sandbox: {
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
                        userId: viewerId,
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
          formTrigger: {
            get viewerId() {
              return viewerId
            },
            get formId() {
              return formId
            },
            get record() {
              return JSON.parse(record)
            },
          },
        },
      })
      await vm.run(script)
      e.taskService.complete(e.task)
    })
  }
}
