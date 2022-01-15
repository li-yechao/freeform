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
import { FormControl, FormLabel, Input, TextField } from '@mui/material'
import { Field } from '../state'

export interface TextProps extends Field {
  meta?: {
    placeholder?: string
  }
}

export const initialTextProps: Omit<TextProps, 'id' | 'type'> = {
  label: '文本',
}

export default function Text(props: TextProps & { tabIndex?: number }) {
  return (
    <_Input
      disableUnderline
      fullWidth
      readOnly={props.state === 'READONLY'}
      disabled={props.state === 'DISABLED'}
      placeholder={props.meta?.placeholder}
      inputProps={{ tabIndex: props.tabIndex }}
    />
  )
}

const _Input = styled(Input)`
  border: 1px solid ${props => props.theme.palette.divider};
  border-radius: ${props => props.theme.shape.borderRadius}px;

  input {
    padding-left: ${props => props.theme.spacing(0.5)};
    padding-right: ${props => props.theme.spacing(0.5)};
  }
`

export function TextConfigure({
  field,
  setField,
}: {
  field: TextProps
  setField: (field: Partial<TextProps>) => void
}) {
  return (
    <>
      <FormControl size="small" fullWidth margin="dense">
        <FormLabel>提示</FormLabel>

        <TextField
          variant="outlined"
          size="small"
          fullWidth
          value={field.meta?.placeholder || ''}
          onChange={e => setField({ meta: { placeholder: e.target.value } })}
        />
      </FormControl>
    </>
  )
}