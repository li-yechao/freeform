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
import styled from '@emotion/styled'
import { useMemo } from 'react'
import MonacoEditor from '../components/MonacoEditor/MonacoEditor'
import { isNode, Node, ScriptJsNode, Trigger } from '../state'

export default function ScriptJsNodeConfigure({
  nodes,
  ids,
  applicationId,
  node,
  onChange,
}: {
  nodes: { [key: string]: Trigger | Node }
  ids: string[]
  applicationId: string
  node: ScriptJsNode
  onChange: (node: Partial<ScriptJsNode>) => void
}) {
  const trigger = nodes[ids[0]!]
  const defines = useApplicationDefines({
    applicationId,
    trigger: isNode(trigger) ? undefined : trigger,
  })

  return (
    <_Container>
      <_MonacoEditor
        value={node.script}
        extraLibs={defines}
        onChange={script => onChange({ script })}
      />
    </_Container>
  )
}

const _Container = styled.div`
  height: 50vh;
  min-height: 200px;
`

const _MonacoEditor = styled(MonacoEditor)`
  border: 1px solid #d9d9d9;
  border-radius: 2px;
`

const useApplicationDefines = ({
  applicationId,
  trigger,
}: {
  applicationId: string
  trigger?: Trigger
}) => {
  const { data: { application } = {} } = useQuery<{
    application: {
      id: string
      name?: string

      forms: {
        id: string
        name?: string

        fields: {
          id: string
          label?: string
          type: string
        }[]
      }[]
    }
  }>(
    gql`
      query Application($applicationId: String!) {
        application(applicationId: $applicationId) {
          id
          name

          forms {
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
    `,
    { variables: { applicationId } }
  )

  return useMemo(() => {
    if (!application) {
      return
    }

    const defines = `
${application.forms
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

  selectRecord(args: { recordId: string }): Promise<Record_${form.id} | null>

  createRecord(args: { data: Partial<Record_${form.id}['data']> }): Promise<Record_${form.id}>

  updateRecord(args: {
    recordId: string
    data: Partial<Record_${form.id}['data']>
  }): Promise<Record_${form.id} | null>

  deleteRecord(args: { recordId: string }): Promise<Record_${form.id} | null>
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
  ${application.forms
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
    `

    const libs = [{ content: defines }]

    if (trigger?.formId) {
      libs.push({
        content: `
declare const formTrigger: {
  readonly viewerId: string

  readonly formId: '${trigger.formId}'

  readonly record: Record_${trigger.formId}
}
  `,
      })
    }

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
