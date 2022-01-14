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
import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  TextField,
} from '@mui/material'
import { memo } from 'react'
import { ConfigureRenderer } from './field'
import { useCurrentField, useSetField } from './state'

export default function Configure() {
  const field = useCurrentField()
  const setField = useSetField()

  if (!field) {
    return null
  }

  return (
    <_Configure>
      <LabelConfigure />

      <StateConfigure />

      <ConfigureRenderer field={field} setField={value => setField(field.id, value)} />
    </_Configure>
  )
}

const _Configure = styled.div`
  padding: ${props => props.theme.spacing(2)};

  > .MuiFormControl-root {
    > .MuiFormLabel-root {
      font-size: ${props => props.theme.typography.subtitle2.fontSize};
    }
  }
`

const LabelConfigure = memo(() => {
  const field = useCurrentField()
  const setField = useSetField()

  if (!field) {
    return null
  }

  return (
    <FormControl size="small" fullWidth margin="dense">
      <FormLabel>标题</FormLabel>

      <TextField
        variant="outlined"
        size="small"
        fullWidth
        value={field.label}
        onChange={e => setField(field.id, { label: e.target.value })}
      />
    </FormControl>
  )
})

const StateConfigure = memo(() => {
  const field = useCurrentField()
  const setField = useSetField()

  if (!field) {
    return null
  }

  return (
    <FormControl size="small" fullWidth margin="dense">
      <FormLabel>状态</FormLabel>

      <RadioGroup
        row
        value={field.state || 'NORMAL'}
        onChange={e => {
          setField(field.id, {
            state: e.target.value === 'NORMAL' ? undefined : (e.target.value as any),
          })
        }}
      >
        <FormControlLabel control={<Radio />} value="NORMAL" label="正常" />
        <FormControlLabel control={<Radio />} value="READONLY" label="只读" />
        <FormControlLabel control={<Radio />} value="DISABLED" label="禁用" />
      </RadioGroup>
    </FormControl>
  )
})
