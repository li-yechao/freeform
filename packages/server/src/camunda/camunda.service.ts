import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as camunda from 'camunda-external-task-client-js'
import { NodeVM } from 'vm2'
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
    this.client.subscribe('script_js', e => {
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

      const vm = new NodeVM({
        sandbox: {
          variables: {
            get formTriggerViewerId() {
              return viewerId
            },
            get formTriggerApplicationId() {
              return applicationId
            },
            get formTriggerFormId() {
              return formId
            },
            get formTriggerRecord() {
              return JSON.parse(e.task.variables.get('form_trigger_record'))
            },
          },
          query: {
            selectRecord: ({ formId, recordId }: { formId: string; recordId: string }) => {
              return this.recordService.workflow_selectRecord({ formId, recordId })
            },
          },
          mutation: {
            createRecord: ({
              formId,
              data,
            }: {
              formId: string
              data: { [key: string]: { value: any } }
            }) => {
              return this.recordService.workflow_createRecord({ owner: viewerId, formId, data })
            },
            updateRecord: ({
              formId,
              recordId,
              data,
            }: {
              formId: string
              recordId: string
              data: { [key: string]: { value: any } }
            }) => {
              return this.recordService.workflow_updateRecord({ formId, recordId, data })
            },
            deleteRecord: ({ formId, recordId }: { formId: string; recordId: string }) => {
              return this.recordService.workflow_deleteRecord({ formId, recordId })
            },
          },
        },
      })
      vm.run(script)
      e.taskService.complete(e.task)
    })
  }
}
