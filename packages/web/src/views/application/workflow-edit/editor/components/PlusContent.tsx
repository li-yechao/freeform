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
import { Button, Space } from 'antd'
import { ReactNode } from 'react'

export interface ButtonItem {
  type: string
  icon: ReactNode
  title: string
}

export interface PlusContentProps {
  buttons: { title: string; children: ButtonItem[] }[]
  onClick: (item: ButtonItem) => void
}

export default function PlusContent(props: PlusContentProps) {
  return (
    <_Container>
      {props.buttons.map(section => (
        <div key={section.title}>
          <_Subtitle>{section.title}</_Subtitle>

          <Space size="middle">
            {section.children.map(item => (
              <Button key={item.type} icon={item.icon} onClick={() => props.onClick(item)}>
                {item.title}
              </Button>
            ))}
          </Space>
        </div>
      ))}
    </_Container>
  )
}

const _Container = styled.div``

const _Subtitle = styled.div`
  margin: 8px 0;
`
