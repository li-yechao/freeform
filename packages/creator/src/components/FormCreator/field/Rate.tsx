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

import { Rate as _Rate } from 'antd'
import { FieldProps } from '.'

export interface RateProps extends FieldProps {}

export const initialRateProps: Omit<RateProps, 'id' | 'type'> = {
  label: '评分',
}

export default function Rate(props: RateProps & { tabIndex?: number }) {
  return (
    <_Rate
      disabled={props.state === 'DISABLED' || props.state === 'READONLY'}
      value={props.value}
      onChange={value => props.onChange?.(value)}
    />
  )
}

export function RateConfigure({
  field: _field,
  setField: _setField,
}: {
  field: RateProps
  setField: (field: Partial<RateProps>) => void
}) {
  return <></>
}
