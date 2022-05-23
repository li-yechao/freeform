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

import { gql, useQuery } from '@apollo/client'
import { useMemo } from 'react'
import { Trigger } from './state'

export default function useApplicationDefines({
  applicationId,
  trigger,
}: {
  applicationId: string
  trigger?: Trigger
}) {
  const { data: { application } = {} } = useQuery<{
    application: {
      id: string
      name?: string

      forms: {
        nodes: {
          id: string
          name?: string

          fields: {
            id: string
            label?: string
            type: string
          }[]
        }[]
      }
    }
  }>(
    gql`
      query Application($applicationId: String!) {
        application(applicationId: $applicationId) {
          id
          name

          forms(first: 100) {
            nodes {
              id
              name

              fields {
                id
                label
                type
              }
            }
          }
        }
      }
    `,
    { variables: { applicationId } }
  )

  return useMemo(() => {
    const libs: { content: string }[] = []

    if (!application) {
      return libs
    }

    // globalThis.console
    libs.push({
      content: `
declare interface Console {
  log(message?: any, ...optionalParams: any[]): void
}

declare const console: Console
`,
    })

    // globalThis.formTrigger
    if (trigger?.formId) {
      libs.push({
        content: `
/**
 * 表单事件触发的数据
 */
declare const formTrigger: {
  /**
   * 触发流程的数据的操作人
   */
  readonly viewerId: string

  /**
   * 触发流程的表单 id
   */
  readonly formId: '${trigger.formId}'

  /**
   * 触发流程的表单数据
   */
  readonly record: Record_${trigger.formId}
}
`,
      })
    }

    // globalThis.application
    libs.push({
      content: `
${application.forms.nodes
  .map(
    form => `
/**
 * 表单 - ${form.name || '未命名'}
 */
declare interface Form_${form.id} {
  /**
   * 表单 - ${form.name || '未命名'}
   */
  readonly id: '${form.id}'

  /**
   * 字段
   */
  readonly fields: {
    ${form.fields
      .map(
        field => `
    /**
     * 字段 - ${field.label || '未命名'}
     */
    readonly '${field.id}': {

      /**
       * 字段 - ${field.label || '未命名'}
       */
      readonly id: '${field.id}'
    }
    `
      )
      .join('\n')}
  }

  findOne(args: { recordId: string }): Promise<Record_${form.id} | null>

  create(args: { data: Partial<Record_${form.id}['data']> }): Promise<Record_${form.id}>

  update(args: {
    recordId: string
    data: Partial<Record_${form.id}['data']>
  }): Promise<Record_${form.id} | null>

  delete(args: { recordId: string }): Promise<Record_${form.id} | null>
}


declare interface Record_${form.id} {
  id: string

  owner: string

  form: string

  createdAt: number

  updatedAt?: number

  deletedAt?: number

  data?: {
    ${form.fields
      .map(
        field => `
    /**
     * 字段 ${field.label || '未命名'}
     */
    '${field.id}': { value: ${fieldTypeToTypescriptType(field.type)} } | undefined
    `
      )
      .join('\n')}
  }
}
`
  )
  .join('\n')}

/**
 * ${application.name || '未命名应用'}
 */
declare const application: {
  ${application.forms.nodes
    .map(
      form => `
  /**
   * 表单 ${form.name || '未命名表单'}
   */
  readonly form_${form.id}: Form_${form.id}
  `
    )
    .join('\n')}
}
`,
    })

    // globalThis.outputs
    libs.push({
      content: `
declare type JsonPrimitive = string | number | boolean | null | undefined

declare type JsonArray = Array<JsonPrimitive> | Array<JsonObject> | Array<JsonArray>

declare type JsonObject = {
  [key: string]: JsonPrimitive | JsonObject | JsonArray
}

declare type Json = JsonPrimitive | JsonObject | JsonArray

declare interface Outputs {
  [key: string]: Json
}

/**
 * 节点输出的数据
 */
declare const outputs: Outputs
`,
    })

    return libs
  }, [application])
}

function fieldTypeToTypescriptType(type: string): string {
  switch (type) {
    case 'number':
    case 'rate':
    case 'time':
      return 'number'
    case 'text':
    case 'checkbox':
    case 'radio':
      return 'string'
    default:
      return 'any'
  }
}
