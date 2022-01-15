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
  CalendarToday,
  CheckBox,
  Numbers,
  RadioButtonChecked,
  StarBorder,
  TextFields,
} from '@mui/icons-material'
import { Button } from '@mui/material'
import { ReactNode, useMemo } from 'react'
import { useDrag } from 'react-dnd'
import { useAddOrMoveField } from './state'

export default function Fields() {
  const fields = useMemo(
    () => [
      { type: 'text', icon: <TextFields />, title: '文本' },
      { type: 'number', icon: <Numbers />, title: '数字' },
      { type: 'checkbox', icon: <CheckBox />, title: '多选' },
      { type: 'radio', icon: <RadioButtonChecked />, title: '单选' },
      { type: 'rating', icon: <StarBorder />, title: '评分' },
      { type: 'time', icon: <CalendarToday />, title: '时间' },
    ],
    []
  )

  return (
    <_Fields>
      {fields.map((field, index) => (
        <Field key={index} type={field.type} icon={field.icon} title={field.title} />
      ))}
    </_Fields>
  )
}

const Field = ({ type, icon, title }: { type: string; icon: ReactNode; title: string }) => {
  const addField = useAddOrMoveField()

  const [collected, drag] = useDrag(() => ({
    type: 'field',
    item: { type },
    options: { dropEffect: 'copy' },
  }))

  return (
    <_Field
      variant="outlined"
      disableRipple
      ref={drag}
      {...collected}
      onClick={() => addField({ type })}
      startIcon={icon}
    >
      {title}
    </_Field>
  )
}

const _Field = styled(Button)`
  width: calc(50% - 8px);
  margin: 4px;
`

const _Fields = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  padding: ${props => props.theme.spacing(2, 1, 1)};
`
