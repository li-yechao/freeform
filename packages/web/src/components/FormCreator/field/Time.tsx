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

import styled from '@emotion/styled'
import { Box } from '@mui/system'
import { Input, Select, Typography } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useRef, useState } from 'react'
import { FieldProps, InitialFieldProps } from '.'
import DatePicker from '../../DatePicker'

export type TimeType = 'date' | 'year' | 'month' | 'datetime'

export interface TimeProps extends FieldProps {
  meta?: {
    placeholder?: string
    type?: TimeType
  }
}

export const initialTimeProps: InitialFieldProps<TimeProps> = {
  label: '时间',
}

export default function Time(props: TimeProps & { tabIndex?: number }) {
  const ref = useRef<number | null>()
  const [value, setValue] = useState<dayjs.Dayjs | null>()

  useEffect(() => {
    if (ref.current !== props.value) {
      ref.current = props.value
      setValue(typeof props.value === 'number' ? dayjs(props.value * 1000) : null)
    }
  }, [props.value])

  useEffect(() => {
    const v = value?.startOf(START_OF[props.meta?.type || 'datetime']).unix() ?? null
    if (ref.current !== v) {
      ref.current = v
      props.onChange?.(ref.current)
    }
  }, [value])

  let picker = props.meta?.type
  let showTime = false
  if (picker === 'datetime') {
    picker = 'date'
    showTime = true
  }

  return (
    <_DatePicker
      disabled={props.state === 'DISABLED' || props.state === 'READONLY'}
      placeholder={props.meta?.placeholder || ''}
      tabIndex={props.tabIndex}
      value={value}
      onChange={setValue}
      picker={picker}
      showTime={showTime}
    />
  )
}

const START_OF = {
  year: 'year',
  month: 'month',
  date: 'date',
  datetime: 'second',
} as const

const _DatePicker = styled(DatePicker)`
  width: 100%;
`

export function TimeCell(props: TimeProps) {
  if (!props.value) {
    return null
  }

  const type = props.meta?.type || 'date'

  const format = {
    year: 'YYYY',
    month: 'YYYY-MM',
    date: 'YYYY-MM-DD',
    datetime: 'YYYY-MM-DD HH:mm:ss',
  }[type]

  if (!format) {
    return null
  }

  return <>{dayjs(props.value * 1000).format(format)}</>
}

export function TimeConfigure({
  field,
  setField,
}: {
  field: InitialFieldProps<TimeProps>
  setField: (field: Partial<InitialFieldProps<TimeProps>>) => void
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
        <Typography.Text type="secondary">类型</Typography.Text>

        <div>
          <Select
            value={field.meta?.type || 'date'}
            onChange={type => setField({ meta: { type } })}
            style={{ width: '100%' }}
          >
            <Select.Option value="year">年份</Select.Option>
            <Select.Option value="month">月份</Select.Option>
            <Select.Option value="date">日期</Select.Option>
            <Select.Option value="datetime">日期时间</Select.Option>
          </Select>
        </div>
      </Box>
    </>
  )
}
