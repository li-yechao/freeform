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

import { gql, QueryHookOptions, useQuery } from '@apollo/client'
import { Checkbox, Select, Space, Typography } from 'antd'
import { FormTrigger } from '../state'

export default function FormTriggerConfigure({
  applicationId,
  node,
  onChange,
}: {
  applicationId: string
  node: FormTrigger
  onChange: (node: Partial<FormTrigger>) => void
}) {
  const { data: { application } = {} } = useApplicationForms({ variables: { applicationId } })
  const forms = application?.forms

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Typography.Title level={5}>表单</Typography.Title>

        <Select
          value={node.formId}
          onChange={formId => onChange({ formId })}
          style={{ width: '100%' }}
        >
          {forms?.map(form => (
            <Select.Option key={form.id} value={form.id}>
              {form.name || '未命名'}
            </Select.Option>
          ))}
        </Select>
      </div>

      <div>
        <Typography.Title level={5}>触发事件</Typography.Title>

        <div>
          <Checkbox
            checked={node.actions?.some(i => i.type === 'create')}
            onChange={v => {
              if (v.target.checked) {
                const actions = [...(node.actions ?? [])]
                if (!actions.some(i => i.type === 'create')) {
                  actions.push({ type: 'create' })
                }
                onChange({ actions })
              } else {
                onChange({ actions: node.actions?.filter(i => i.type !== 'create') })
              }
            }}
          >
            创建成功
          </Checkbox>
        </div>

        <div title="暂不支持">
          <Checkbox disabled>更新成功</Checkbox>
        </div>

        <div title="暂不支持">
          <Checkbox disabled>删除成功</Checkbox>
        </div>
      </div>
    </Space>
  )
}

const useApplicationForms = (
  options: QueryHookOptions<
    { application: { id: string; forms: { id: string; name?: string }[] } },
    { applicationId: string }
  >
) => {
  return useQuery(
    gql`
      query ApplicationForms($applicationId: String!) {
        application(applicationId: $applicationId) {
          id
          forms {
            id
            name
          }
        }
      }
    `,
    options
  )
}
