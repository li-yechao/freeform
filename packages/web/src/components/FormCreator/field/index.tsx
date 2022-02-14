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

import { ComponentProps, ComponentType } from 'react'
import { Field } from '../state'
import Checkbox, { CheckboxConfigure, initialCheckboxProps } from './Checkbox'
import Number, { initialNumberProps, NumberConfigure } from './Number'
import Radio, { initialRadioProps, RadioConfigure } from './Radio'
import Rate, { initialRateProps, RateConfigure } from './Rate'
import Text, { initialTextProps, TextConfigure } from './Text'
import Time, { initialTimeProps, TimeCell, TimeConfigure } from './Time'

export interface FieldProps extends Field {
  value?: any
  onChange?: (value: any) => void
  tabIndex?: number
}

export default function FieldRenderer(props: FieldProps) {
  const F = FIELDS[props.type as keyof typeof FIELDS]
  if (F) {
    return <F {...props} />
  }

  throw new Error(`Unsupported field type ${props.type}`)
}

const FIELDS = {
  text: Text,
  number: Number,
  radio: Radio,
  checkbox: Checkbox,
  rate: Rate,
  time: Time,
}

export function defaultProps(type: string) {
  const props = DEFAULT_PROPS[type as keyof typeof FIELDS]
  if (!props) {
    throw new Error(`Unsupported initial props ${type}`)
  }
  return props
}

const DEFAULT_PROPS: {
  [key in keyof typeof FIELDS]: Omit<ComponentProps<typeof FIELDS[key]>, 'id' | 'type'>
} = {
  text: initialTextProps,
  number: initialNumberProps,
  radio: initialRadioProps,
  checkbox: initialCheckboxProps,
  rate: initialRateProps,
  time: initialTimeProps,
}

export function ConfigureRenderer({
  field,
  setField,
}: {
  field: Field
  setField: (field: Partial<Field>) => void
}) {
  const F = CONFIGURES[field.type as keyof typeof FIELDS]
  if (F) {
    return <F field={field} setField={setField} />
  }

  throw new Error(`Unsupported field type ${field.type}`)
}

const CONFIGURES: {
  [key in keyof typeof FIELDS]: ComponentType<{
    field: Field
    setField: (field: Partial<Field>) => void
  }>
} = {
  text: TextConfigure,
  number: NumberConfigure,
  radio: RadioConfigure,
  checkbox: CheckboxConfigure,
  rate: RateConfigure,
  time: TimeConfigure,
}

export function CellRenderer(props: FieldProps) {
  const F = CELLS[props.type as keyof typeof FIELDS]
  if (F) {
    return <F {...props} />
  }

  return props.value
}

const CELLS: {
  [key in keyof typeof FIELDS]?: ComponentType<FieldProps>
} = {
  time: TimeCell,
}
