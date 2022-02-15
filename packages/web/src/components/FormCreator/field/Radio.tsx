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

import { Radio as _Radio } from 'antd'
import { FieldProps, InitialFieldProps } from '.'
import { nextOptionId, OptionsConfigure } from './Checkbox'

export interface RadioProps extends FieldProps {
  meta?: {
    options?: { id: string; label: string; value: any }[]
  }
}

export const initialRadioProps: InitialFieldProps<RadioProps> = {
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
    <_Radio.Group
      disabled={props.state === 'DISABLED' || props.state === 'READONLY'}
      value={props.value}
      onChange={e => props.onChange?.(e.target.value)}
    >
      {props.meta?.options?.map((option, index) => (
        <_Radio
          key={index}
          tabIndex={props.tabIndex}
          value={option.value}
          children={option.label}
        />
      ))}
    </_Radio.Group>
  )
}

export function RadioConfigure({
  field,
  setField,
}: {
  field: InitialFieldProps<RadioProps>
  setField: (field: Partial<InitialFieldProps<RadioProps>>) => void
}) {
  return (
    <>
      <OptionsConfigure field={field} setField={setField} />
    </>
  )
}
