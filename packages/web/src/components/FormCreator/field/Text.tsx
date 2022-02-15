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
import { Input, InputNumber, Space, Switch, Typography } from 'antd'
import { FieldProps, InitialFieldProps } from '.'

export interface TextProps extends FieldProps {
  meta?: {
    placeholder?: string
    maxLength?: number
    multiline?: boolean
  }
}

export const initialTextProps: InitialFieldProps<TextProps> = {
  label: '文本',
}

export default function Text(props: TextProps & { tabIndex?: number }) {
  return props.meta?.multiline ? (
    <Input.TextArea
      readOnly={props.state === 'READONLY'}
      disabled={props.state === 'DISABLED'}
      placeholder={props.meta?.placeholder}
      tabIndex={props.tabIndex}
      value={props.value}
      onChange={e => props.onChange?.(e.target.value)}
      maxLength={props.meta.maxLength}
      autoSize={{ minRows: 2 }}
      showCount={!!props.meta.maxLength}
    />
  ) : (
    <Input
      readOnly={props.state === 'READONLY'}
      disabled={props.state === 'DISABLED'}
      placeholder={props.meta?.placeholder}
      tabIndex={props.tabIndex}
      value={props.value}
      onChange={e => props.onChange?.(e.target.value)}
      maxLength={props.meta?.maxLength}
    />
  )
}

export function TextConfigure({
  field,
  setField,
}: {
  field: InitialFieldProps<TextProps>
  setField: (field: Partial<InitialFieldProps<TextProps>>) => void
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
          <Typography.Text type="secondary">多行输入</Typography.Text>

          <Switch
            checked={field.meta?.multiline === true}
            onChange={checked => setField({ meta: { multiline: checked } })}
          />
        </Space>
      </Box>

      <Box my={2}>
        <Space>
          <Typography.Text type="secondary">最大长度</Typography.Text>

          <InputNumber
            value={field.meta?.maxLength}
            min={1}
            step={1}
            onChange={maxLength => setField({ meta: { maxLength } })}
          />
        </Space>
      </Box>
    </>
  )
}
