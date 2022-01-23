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
import { Input, InputNumber, Typography } from 'antd'
import { Field } from '../state'

export interface NumberProps extends Field {
  meta?: {
    placeholder?: string
  }
}

export const initialNumberProps: Omit<NumberProps, 'id' | 'type'> = {
  label: '数字',
}

export default function Number(props: NumberProps & { tabIndex?: number }) {
  return (
    <_InputNumber
      readOnly={props.state === 'READONLY'}
      disabled={props.state === 'DISABLED'}
      placeholder={props.meta?.placeholder}
      tabIndex={props.tabIndex}
    />
  )
}

const _InputNumber = styled(InputNumber)`
  width: 100%;
`

export function NumberConfigure({
  field,
  setField,
}: {
  field: NumberProps
  setField: (field: Partial<NumberProps>) => void
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
