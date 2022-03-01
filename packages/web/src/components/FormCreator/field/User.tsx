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

import { gql, useApolloClient } from '@apollo/client'
import styled from '@emotion/styled'
import { Box } from '@mui/system'
import { Input, Space, Switch, Tag, TreeSelect, Typography } from 'antd'
import { useCallback, useEffect, useRef, useState } from 'react'
import { FieldProps, InitialFieldProps } from '.'
import useAsync from '../../../utils/useAsync'

export interface UserProps extends FieldProps {
  meta?: {
    placeholder?: string
    multiple?: boolean
  }
  value?: string | string[]
}

export const initialUserProps: InitialFieldProps<UserProps> = {
  label: '人员',
}

export default function User(props: UserProps & { tabIndex?: number }) {
  const queryDepartments = useQueryDepartments()
  const queryUsers = useQueryUsers()

  const { data, addData } = useTreeData()

  const loadData = async ({ id: parentId }: { id?: string } = {}) => {
    const res = await queryDepartments({
      variables: { applicationId: props.applicationId, departmentId: parentId },
    })
    const list = res.data?.departments ?? []

    addData(
      list
        .map(department => ({
          id: department.id,
          pId: department.parentId,
          value: department.id,
          title: department.name,
          selectable: false,
        }))
        .concat(
          list.flatMap(department =>
            department.users.map(user => ({
              id: user.id,
              pId: department.id,
              value: user.id,
              title: user.name,
              selectable: true,
              isLeaf: true,
            }))
          )
        )
    )
  }

  useEffect(() => {
    const userIds = (typeof props.value === 'string' ? [props.value] : props.value)?.filter(
      id => !data.some(item => item.value === id)
    )
    if (!userIds?.length) {
      return
    }
    queryUsers({ variables: { applicationId: props.applicationId, userIds } }).then(res => {
      addData(
        (res.data?.users ?? []).map(user => ({
          id: user.id,
          pId: user.departmentId,
          value: user.id,
          title: user.name,
          selectable: true,
          isLeaf: true,
        }))
      )
    })
  }, [props.value, data])

  useEffect(() => {
    loadData()
  }, [])

  return (
    <_TreeSelect
      disabled={props.state === 'DISABLED' || props.state === 'READONLY'}
      placeholder={props.meta?.placeholder}
      tabIndex={props.tabIndex}
      value={props.meta?.multiple && typeof props.value === 'string' ? [props.value] : props.value}
      onChange={value => props.onChange?.(value)}
      multiple={props.meta?.multiple}
      treeDataSimpleMode
      treeData={data}
      loadData={loadData as any}
    />
  )
}

const _TreeSelect = styled(TreeSelect)`
  width: 100%;
`

export function UserCell(props: UserProps) {
  if (!props.value) {
    return null
  }

  const queryUsers = useQueryUsers()

  const options = useAsync(async () => {
    if (!props.value?.length) {
      return []
    }

    return queryUsers({
      variables: {
        applicationId: props.applicationId,
        userIds: typeof props.value === 'string' ? [props.value] : props.value,
      },
    }).then(res =>
      res.data?.users.map(i => ({
        value: i.id,
        label: i.name,
      }))
    )
  }, [props.value])

  return (
    <Space>
      {options.value?.map(option => (
        <Tag key={option.value}>{option.label}</Tag>
      ))}
    </Space>
  )
}

const useQueryDepartments = () => {
  const client = useApolloClient()

  return useCallback(
    (options: {
      variables: { applicationId: string; departmentId?: string; departmentIds?: string[] }
    }) => {
      return client.query<{
        departments: {
          id: string
          parentId?: string
          name: string
          users: { id: string; name: string }[]
        }[]
      }>({
        query: gql`
          query Departments(
            $applicationId: String!
            $departmentId: String
            $departmentIds: [String!]
          ) {
            departments(
              applicationId: $applicationId
              departmentId: $departmentId
              departmentIds: $departmentIds
            ) {
              id
              name
              parentId

              users {
                id
                name
              }
            }
          }
        `,
        ...options,
      })
    },
    []
  )
}

const useQueryUsers = () => {
  const client = useApolloClient()

  return useCallback((options?: { variables: { applicationId: string; userIds?: string[] } }) => {
    return client.query<{ users: { id: string; name: string; departmentId: string }[] }>({
      query: gql`
        query Users($applicationId: String!, $userIds: [String!]) {
          users(applicationId: $applicationId, userIds: $userIds) {
            id
            name
            departmentId
          }
        }
      `,
      ...options,
    })
  }, [])
}

const useTreeData = () => {
  const keys = useRef<{ [key: string]: typeof data[0] | undefined }>({})
  const [data, setData] = useState<
    { id: string; pId: string | undefined; value: string; title: string }[]
  >([])

  const addData = useCallback((list: typeof data) => {
    const l: typeof list = []

    for (const item of list) {
      if (!keys.current[item.id]) {
        keys.current[item.id] = item
        l.push(item)
      }
    }

    setData(v => v.concat(l))
  }, [])

  return { data, addData }
}

export function UserConfigure({
  field,
  setField,
}: {
  field: InitialFieldProps<UserProps>
  setField: (field: Partial<InitialFieldProps<UserProps>>) => void
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
        <Space>
          <Typography.Text type="secondary">多选</Typography.Text>

          <Switch
            checked={field.meta?.multiple === true}
            onChange={multiple => setField({ meta: { multiple } })}
          />
        </Space>
      </Box>
    </>
  )
}
