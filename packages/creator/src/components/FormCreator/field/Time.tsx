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
import { DatePicker } from '@mui/lab'
import { FormControl, FormLabel, TextField } from '@mui/material'
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
    <DatePicker
      value={undefined}
      onChange={() => {}}
      readOnly={props.state === 'READONLY'}
      disabled={props.state === 'DISABLED'}
      renderInput={params => (
        <_TextField
          {...params}
          variant="standard"
          fullWidth
          placeholder={props.meta?.placeholder}
          InputProps={{ ...params.InputProps, disableUnderline: true }}
          inputProps={{ tabIndex: props.tabIndex }}
        />
      )}
    />
  )
}

const _TextField = styled(TextField)`
  border: 1px solid ${props => props.theme.palette.divider};
  border-radius: ${props => props.theme.shape.borderRadius}px;

  .MuiInput-root {
    padding-left: ${props => props.theme.spacing(0.5)};
    padding-right: ${props => props.theme.spacing(1)};
  }
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
