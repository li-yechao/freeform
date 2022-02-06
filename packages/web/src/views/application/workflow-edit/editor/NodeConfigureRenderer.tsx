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

import { CodeOutlined, FileTextOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { Button, Drawer, Space } from 'antd'
import produce from 'immer'
import { ComponentType, ReactNode, useEffect, useState } from 'react'
import NodeIcon from './components/NodeIcon'
import FormTriggerConfigure from './nodes/FormTriggerConfigure'
import ScriptJsNodeConfigure from './nodes/ScriptJsNodeConfigure'
import { Node, Trigger, useCurrentNode, useSetCurrentNode, useUpdateNode } from './state'

export default function NodeConfigureRenderer({ applicationId }: { applicationId: string }) {
  const node = useCurrentNode()
  const setCurrentNode = useSetCurrentNode()
  const updateNode = useUpdateNode()

  const C = node && RENDERERS[node.type]

  const [draft, setDraft] = useState(node)

  useEffect(() => {
    setDraft(node)
  }, [node])

  const handleChange = (n: NonNullable<typeof node>) => {
    setDraft(v => produce(v, d => Object.assign(d, n)))
  }

  const handleClose = () => setCurrentNode()

  const handleSave = () => {
    draft && updateNode(draft)
    handleClose()
  }

  return (
    <_Drawer
      visible={Boolean(node)}
      width=""
      onClose={handleClose}
      title={node && <Title node={node} />}
      footer={
        <Space>
          <Button type="primary" onClick={handleSave}>
            保存
          </Button>
          <Button type="default" onClick={handleClose}>
            取消
          </Button>
        </Space>
      }
    >
      {C && draft && <C applicationId={applicationId} node={draft} onChange={handleChange} />}
    </_Drawer>
  )
}

const RENDERERS: {
  [key in Node['type'] | Trigger['type']]: ComponentType<{
    applicationId: string
    node: any
    onChange: (node: any) => void
  }>
} = {
  form_trigger: FormTriggerConfigure,
  script_js: ScriptJsNodeConfigure,
}

const _Drawer = styled(Drawer)`
  > .ant-drawer-mask {
    background-color: transparent;
  }

  > .ant-drawer-content-wrapper {
    width: 40%;
  }
`

const Title = ({ node }: { node: Node | Trigger }) => {
  let icon: ReactNode | undefined
  let name: string | undefined

  switch (node.type) {
    case 'form_trigger': {
      icon = (
        <NodeIcon>
          <FileTextOutlined />
        </NodeIcon>
      )
      name = '表单事件触发'
      break
    }
    case 'script_js': {
      icon = (
        <NodeIcon>
          <CodeOutlined />
        </NodeIcon>
      )
      name = 'JavaScript'
      break
    }
  }

  return (
    <Space>
      {icon}
      <span>{name}</span>
    </Space>
  )
}
