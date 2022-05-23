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
import { Input, Space, Tag, TreeSelect, Typography } from 'antd'
import { useCallback, useEffect, useRef, useState } from 'react'
import { FieldProps, InitialFieldProps } from '.'
import useAsync from '../../../utils/useAsync'

export interface DistrictProps extends FieldProps {
  meta?: {
    placeholder?: string
  }
  value?: string | string[]
}

export const initialDistrictProps: InitialFieldProps<DistrictProps> = {
  label: '地区',
}

export default function District(props: DistrictProps & { tabIndex?: number }) {
  const queryDistricts = useQueryDistricts()

  const { data, addData } = useTreeData()

  const loadData = async ({ id: parentId }: { id?: string } = {}) => {
    const res = await queryDistricts({
      variables: { applicationId: props.applicationId, districtId: parentId },
    })
    const list = res.data?.districts ?? []

    addData(
      list.map(district => ({
        id: district.id,
        pId: district.parentId,
        value: district.id,
        title: district.name,
      }))
    )
  }

  useEffect(() => {
    const districtIds = (typeof props.value === 'string' ? [props.value] : props.value)?.filter(
      id => !data.some(item => item.value === id)
    )
    if (!districtIds?.length) {
      return
    }
    queryDistricts({ variables: { applicationId: props.applicationId, districtIds } }).then(res => {
      addData(
        (res.data?.districts ?? []).map(district => ({
          id: district.id,
          pId: district.parentId,
          value: district.id,
          title: district.name,
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
      value={props.value}
      onChange={value => props.onChange?.(value)}
      treeDataSimpleMode
      treeData={data}
      loadData={loadData as any}
    />
  )
}

const _TreeSelect = styled(TreeSelect)`
  width: 100%;
`

export function DistrictCell(props: DistrictProps) {
  if (!props.value) {
    return null
  }

  const queryDistricts = useQueryDistricts()

  const options = useAsync(async () => {
    if (!props.value?.length) {
      return []
    }

    return queryDistricts({
      variables: {
        applicationId: props.applicationId,
        districtIds: typeof props.value === 'string' ? [props.value] : props.value,
      },
    }).then(res =>
      res.data?.districts.map(i => ({
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

const useQueryDistricts = () => {
  const client = useApolloClient()

  return useCallback(
    (options: {
      variables: { applicationId: string; districtId?: string; districtIds?: string[] }
    }) => {
      return client.query<{ districts: { id: string; parentId?: string; name: string }[] }>({
        query: gql`
          query Districts($applicationId: String!, $districtId: String, $districtIds: [String!]) {
            districts(
              applicationId: $applicationId
              districtId: $districtId
              districtIds: $districtIds
            ) {
              id
              name
              parentId
            }
          }
        `,
        ...options,
      })
    },
    []
  )
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

export function DistrictConfigure({
  field,
  setField,
}: {
  field: InitialFieldProps<DistrictProps>
  setField: (field: Partial<InitialFieldProps<DistrictProps>>) => void
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
    </>
  )
}
