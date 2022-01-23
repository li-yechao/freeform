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
import { DatePicker, Input, Typography } from 'antd'
import { Field } from '../state'

export interface TimeProps extends Field {
  meta?: {
    placeholder?: string
  }
}

export const initialTimeProps: Omit<TimeProps, 'id' | 'type'> = {
  label: '时间',
}

export default function Time(props: TimeProps & { tabIndex?: number }) {
  return (
    <_DatePicker
      value={undefined}
      onChange={() => {}}
      disabled={props.state === 'DISABLED' || props.state === 'READONLY'}
      placeholder={props.meta?.placeholder || ''}
      tabIndex={props.tabIndex}
    />
  )
}

const _DatePicker = styled(DatePicker)`
  width: 100%;
`

export function TimeConfigure({
  field,
  setField,
}: {
  field: TimeProps
  setField: (field: Partial<TimeProps>) => void
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
