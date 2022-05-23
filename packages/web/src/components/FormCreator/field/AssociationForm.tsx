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

import { gql, useLazyQuery, useQuery } from '@apollo/client'
import styled from '@emotion/styled'
import { Box } from '@mui/system'
import { Input, Radio, Select, Space, Tag, Typography } from 'antd'
import { FieldProps, InitialFieldProps } from '.'
import useAsync from '../../../utils/useAsync'
import DebounceSelect from '../../DebounceSelect'

export interface AssociationFormProps extends FieldProps {
  meta?: {
    placeholder?: string
    associationFormId?: string
    mainFieldId?: string
    multiple?: boolean
  }
}

export const initialAssociationFormProps: InitialFieldProps<AssociationFormProps> = {
  label: '关联表',
}

export default function AssociationForm(props: AssociationFormProps & { tabIndex?: number }) {
  const [queryRecords] = useLazyQuery<
    {
      application: {
        id: string

        form: {
          id: string

          records: {
            nodes: { id: string; data?: { [key: string]: { value: any } } }[]
          }
        }
      }
    },
    {
      applicationId: string
      formId: string
      first: number
    }
  >(
    gql`
      query RecordsByAssociationFormFieldSearch(
        $applicationId: String!
        $formId: String!
        $first: Int!
      ) {
        application(applicationId: $applicationId) {
          id

          form(formId: $formId) {
            id

            records(first: $first) {
              nodes {
                id
                data
              }
            }
          }
        }
      }
    `
  )

  const fetchOptions = () => {
    const { mainFieldId, associationFormId } = props.meta || {}

    if (!mainFieldId || !associationFormId) {
      throw new Error(`Required props mainFieldId or associationFormId is missing`)
    }

    return queryRecords({
      variables: {
        applicationId: props.applicationId,
        formId: associationFormId,
        first: 10,
      },
    }).then(res => {
      return (
        res.data?.application.form.records.nodes.map(i => ({
          value: i.id,
          label: i.data?.[mainFieldId]?.value?.toString(),
        })) ?? []
      )
    })
  }

  return (
    <_Select
      disabled={props.state === 'DISABLED' || props.state === 'READONLY'}
      placeholder={props.meta?.placeholder}
      tabIndex={props.tabIndex}
      value={props.value}
      onChange={value => props.onChange?.(value)}
      mode={props.meta?.multiple ? 'multiple' : undefined}
      fetchOptions={fetchOptions}
      allowClear
    />
  )
}

const _Select = styled(DebounceSelect)`
  width: 100%;
`

export function AssociationFormCell(props: AssociationFormProps) {
  const [queryRecords] = useLazyQuery<
    {
      application: {
        id: string

        form: {
          id: string

          records: {
            nodes: { id: string; data?: { [key: string]: { value: any } } }[]
          }
        }
      }
    },
    {
      applicationId: string
      formId: string
      recordIds?: string[]
    }
  >(
    gql`
      query RecordsByAssociationFormFieldSearch(
        $applicationId: String!
        $formId: String!
        $recordIds: [String!]
      ) {
        application(applicationId: $applicationId) {
          id

          form(formId: $formId) {
            id

            records(first: 100, recordIds: $recordIds) {
              nodes {
                id
                data
              }
            }
          }
        }
      }
    `
  )

  const options = useAsync(async () => {
    if (!props.value?.length) {
      return []
    }

    const { mainFieldId, associationFormId } = props.meta || {}

    if (!mainFieldId || !associationFormId) {
      throw new Error(`Required props mainFieldId or associationFormId is missing`)
    }

    return queryRecords({
      variables: {
        applicationId: props.applicationId,
        formId: associationFormId,
        recordIds: props.value,
      },
    }).then(
      res =>
        res.data?.application.form.records.nodes.map(i => ({
          value: i.id,
          label: i.data?.[mainFieldId]?.value?.toString(),
        })) ?? []
    )
  }, [props.applicationId, props.formId, props.meta])

  return (
    <Space>
      {options.value?.map(option => (
        <Tag key={option.value}>{option.label}</Tag>
      ))}
    </Space>
  )
}

export function AssociationFormConfigure({
  applicationId,
  field,
  setField,
}: {
  applicationId: string
  field: InitialFieldProps<AssociationFormProps>
  setField: (field: Partial<InitialFieldProps<AssociationFormProps>>) => void
}) {
  return (
    <>
      <Box my={2}>
        <Typography.Text type="secondary">提示</Typography.Text>

        <Input
          value={field.meta?.placeholder || ''}
          onChange={e => setField({ meta: { placeholder: e.target.value } })}
        />
      </Box>

      <Box my={2}>
        <Typography.Text type="secondary">关联表</Typography.Text>

        <div>
          <AssociationFormSelect
            applicationId={applicationId}
            value={field.meta?.associationFormId}
            onChange={associationFormId =>
              setField({
                meta: {
                  associationFormId,
                  mainFieldId:
                    associationFormId === field.meta?.associationFormId
                      ? field.meta.mainFieldId
                      : undefined,
                },
              })
            }
          />
        </div>
      </Box>

      <Box my={2}>
        <Typography.Text type="secondary">显示字段</Typography.Text>

        <div>
          {field.meta?.associationFormId ? (
            <AssociationFormFieldSelect
              applicationId={applicationId}
              formId={field.meta.associationFormId}
              value={field.meta.mainFieldId}
              onChange={mainFieldId => setField({ meta: { mainFieldId } })}
            />
          ) : (
            <Select disabled style={{ width: '100%' }} />
          )}
        </div>
      </Box>

      <Box my={2}>
        <Space>
          <Typography.Text type="secondary">关联记录</Typography.Text>

          <Radio.Group
            value={field.meta?.multiple || false}
            onChange={e => setField({ meta: { multiple: e.target.value } })}
          >
            <Radio value={false}>单条</Radio>
            <Radio value={true}>多条</Radio>
          </Radio.Group>
        </Space>
      </Box>
    </>
  )
}

const AssociationFormSelect = ({
  applicationId,
  value,
  onChange,
}: {
  applicationId: string
  value?: string
  onChange?: (value: string) => void
}) => {
  const { data: { application } = {} } = useQuery<{
    application: {
      id: string
      forms: {
        nodes: { id: string; name?: string }[]
      }
    }
  }>(
    gql`
      query ApplicationForms($applicationId: String!) {
        application(applicationId: $applicationId) {
          id
          forms(first: 100) {
            nodes {
              id
              name
            }
          }
        }
      }
    `,
    { variables: { applicationId } }
  )

  return (
    <Select value={value} onChange={onChange} style={{ width: '100%' }}>
      {application?.forms.nodes.map(form => (
        <Select.Option key={form.id} value={form.id}>
          {form.name || '未命名'}
        </Select.Option>
      ))}
    </Select>
  )
}

const AssociationFormFieldSelect = ({
  applicationId,
  formId,
  value,
  onChange,
}: {
  applicationId: string
  formId: string
  value?: string
  onChange?: (value: string) => void
}) => {
  const { data: { application } = {} } = useQuery<{
    application: { id: string; form: { id: string; fields: { id: string; label: string }[] } }
  }>(
    gql`
      query ApplicationForm($applicationId: String!, $formId: String!) {
        application(applicationId: $applicationId) {
          id
          form(formId: $formId) {
            id

            fields {
              id
              label
            }
          }
        }
      }
    `,
    { variables: { applicationId, formId } }
  )

  return (
    <Select value={value} onChange={onChange} style={{ width: '100%' }}>
      {application?.form.fields.map(field => (
        <Select.Option key={field.id} value={field.id}>
          {field.label || '未命名'}
        </Select.Option>
      ))}
    </Select>
  )
}
