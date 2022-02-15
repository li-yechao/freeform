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

import { Box } from '@mui/system'
import { Select, SelectProps, Spin } from 'antd'
import { debounce } from 'lodash'
import { useEffect, useMemo, useRef, useState } from 'react'

export interface DebounceSelectProps<ValueType = any>
  extends Omit<SelectProps<ValueType>, 'options' | 'children'> {
  fetchOptions: (search: string) => Promise<ValueType[]>
  debounceTimeout?: number
}

export default function DebounceSelect<
  ValueType extends { key?: string; label: React.ReactNode; value: string | number } = any
>({ fetchOptions, debounceTimeout = 800, ...props }: DebounceSelectProps) {
  const [fetching, setFetching] = useState(false)
  const [options, setOptions] = useState<ValueType[]>([])
  const fetchRef = useRef(0)

  const debounceFetcher = useMemo(() => {
    const loadOptions = (value: string) => {
      fetchRef.current += 1
      const fetchId = fetchRef.current
      setOptions([])
      setFetching(true)

      fetchOptions(value)
        .then(newOptions => {
          if (fetchId !== fetchRef.current) {
            // for fetch callback order
            return
          }

          setOptions(newOptions)
        })
        .finally(() => {
          setFetching(false)
        })
    }

    return debounce(loadOptions, debounceTimeout)
  }, [fetchOptions, debounceTimeout])

  useEffect(() => {
    debounceFetcher('')
  }, [])

  return (
    <Select<ValueType>
      filterOption={false}
      onSearch={debounceFetcher}
      showSearch
      notFoundContent={
        fetching ? (
          <Box textAlign="center">
            <Spin size="small" />
          </Box>
        ) : undefined
      }
      {...props}
      options={options}
    />
  )
}
