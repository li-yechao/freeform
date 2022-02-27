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

import { RightOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { Space } from 'antd'
import { ReactNode } from 'react'
import NodeContainer, { NodeContainerProps } from './NodeContainer'

export interface NodeRenderProps
  extends Pick<NodeContainerProps, 'id' | 'plusContent' | 'onDelete' | 'selected' | 'onClick'> {
  icon?: ReactNode
  name?: string
  description?: ReactNode
}

export default function NodeRender({
  icon,
  name,
  description,
  ...containerProps
}: NodeRenderProps) {
  return (
    <NodeContainer {...containerProps}>
      <_Header>
        <Space>
          {icon}
          <_Name>{name || '未命名'}</_Name>
        </Space>
      </_Header>

      <_Content>
        <_Description>{description}</_Description>

        <RightOutlined />
      </_Content>
    </NodeContainer>
  )
}

const _Header = styled.div`
  display: flex;
  align-items: center;
`

const _Name = styled.div`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const _Content = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  line-height: 32px;
  min-height: 32px;
  color: #111f2c;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 4px;
  padding: 4px 8px;
  margin-top: 6px;
`

const _Description = styled.div`
  flex: 1;
  line-height: 24px;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-all;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
`
