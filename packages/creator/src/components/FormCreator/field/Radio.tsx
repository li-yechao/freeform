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

import { FormControlLabel, Radio as _Radio, RadioGroup } from '@mui/material'
import { Field } from '../state'
import { nextOptionId, OptionsConfigure } from './Checkbox'

export interface RadioProps extends Field {
  meta?: {
    options?: { id: string; label: string; value: any }[]
  }
}

export const initialRadioProps: Omit<RadioProps, 'id' | 'type'> = {
  label: '单选',
  meta: {
    options: [
      { id: nextOptionId(), label: '选项1', value: '选项1' },
      { id: nextOptionId(), label: '选项2', value: '选项2' },
    ],
  },
}

export default function Radio(props: RadioProps & { tabIndex?: number }) {
  return (
    <RadioGroup row>
      {props.meta?.options?.map((option, index) => (
        <FormControlLabel
          key={index}
          disabled={props.state === 'DISABLED'}
          control={<_Radio readOnly={props.state === 'READONLY'} tabIndex={props.tabIndex} />}
          value={option.value}
          label={option.label}
        />
      ))}
    </RadioGroup>
  )
}

export function RadioConfigure({
  field,
  setField,
}: {
  field: RadioProps
  setField: (field: Partial<RadioProps>) => void
}) {
  return (
    <>
      <OptionsConfigure field={field} setField={setField} />
    </>
  )
}
