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

import { Rating as _Rating } from '@mui/material'
import { Field } from '../state'

export interface RatingProps extends Field {}

export const initialRatingProps: Omit<RatingProps, 'id' | 'type'> = {
  label: '评分',
}

export default function Rating(props: RatingProps & { tabIndex?: number }) {
  return (
    <_Rating
      readOnly={props.state === 'READONLY'}
      disabled={props.state === 'DISABLED'}
      tabIndex={props.tabIndex}
    />
  )
}

export function RatingConfigure({
  field: _field,
  setField: _setField,
}: {
  field: RatingProps
  setField: (field: Partial<RatingProps>) => void
}) {
  return <></>
}
