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
import { Input, InputNumber, Space, Typography } from 'antd'
import { FieldProps, InitialFieldProps } from '.'

export interface NumberProps extends FieldProps {
  meta?: {
    placeholder?: string
    min?: number
    max?: number
    step?: number
  }
}

export const initialNumberProps: InitialFieldProps<NumberProps> = {
  label: '数字',
}

export default function Number(props: NumberProps & { tabIndex?: number }) {
  return (
    <_InputNumber
      readOnly={props.state === 'READONLY'}
      disabled={props.state === 'DISABLED'}
      placeholder={props.meta?.placeholder}
      tabIndex={props.tabIndex}
      value={props.value}
      onChange={value => props.onChange?.(value)}
      min={props.meta?.min}
      max={props.meta?.max}
      step={props.meta?.step}
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
  field: InitialFieldProps<NumberProps>
  setField: (field: Partial<InitialFieldProps<NumberProps>>) => void
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
        <Space direction="vertical">
          <Space>
            <Typography.Text type="secondary">步长</Typography.Text>

            <InputNumber value={field.meta?.step} onChange={step => setField({ meta: { step } })} />
          </Space>

          <Space>
            <Typography.Text type="secondary">最大</Typography.Text>

            <InputNumber
              step={field.meta?.step}
              value={field.meta?.max}
              onChange={max => setField({ meta: { max } })}
            />
          </Space>

          <Space>
            <Typography.Text type="secondary">最小</Typography.Text>

            <InputNumber
              step={field.meta?.step}
              value={field.meta?.min}
              onChange={min => setField({ meta: { min } })}
            />
          </Space>
        </Space>
      </Box>
    </>
  )
}
