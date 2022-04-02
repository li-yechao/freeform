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

import {
  ApartmentOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CheckSquareOutlined,
  FontSizeOutlined,
  LinkOutlined,
  NumberOutlined,
  StarOutlined,
  UsergroupAddOutlined,
} from '@ant-design/icons'
import styled from '@emotion/styled'
import { Button } from 'antd'
import { ReactNode, useMemo } from 'react'
import { useDrag } from 'react-dnd'
import { useAddOrMoveField } from './state'

export default function Fields() {
  const fields = useMemo(
    () => [
      { type: 'text', icon: <FontSizeOutlined />, title: '文本' },
      { type: 'number', icon: <NumberOutlined />, title: '数字' },
      { type: 'checkbox', icon: <CheckSquareOutlined />, title: '多选' },
      { type: 'radio', icon: <CheckCircleOutlined />, title: '单选' },
      { type: 'rate', icon: <StarOutlined />, title: '评分' },
      { type: 'time', icon: <CalendarOutlined />, title: '时间' },
      { type: 'associationForm', icon: <LinkOutlined />, title: '关联表' },
      { type: 'department', icon: <ApartmentOutlined />, title: '部门' },
      { type: 'user', icon: <UsergroupAddOutlined />, title: '人员' },
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

  const [, drag] = useDrag(() => ({
    type: 'field',
    item: { type },
    options: { dropEffect: 'copy' },
  }))

  return (
    <_Field ref={drag} icon={icon} onClick={() => addField({ type })}>
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
  padding: 16px 8px 8px;
`
