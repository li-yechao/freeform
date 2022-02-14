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
import { Button, Drawer, Modal, Space } from 'antd'
import produce from 'immer'
import { format } from 'prettier/standalone'
import parseTypescript from 'prettier/parser-typescript'
import { ComponentType, ReactNode, useEffect, useState } from 'react'
import NodeIcon from './components/NodeIcon'
import FormTriggerConfigure from './nodes/FormTriggerConfigure'
import ScriptJsNodeConfigure from './nodes/ScriptJsNodeConfigure'
import {
  Node,
  Trigger,
  useCurrentNode,
  useSetCurrentNode,
  useUpdateNode,
  useWorkflow,
} from './state'

export default function NodeConfigureRenderer({ applicationId }: { applicationId: string }) {
  const { nodes, ids } = useWorkflow()
  const node = useCurrentNode()
  const setCurrentNode = useSetCurrentNode()
  const updateNode = useUpdateNode()

  const C = node && RENDERERS[node.type]

  const [draft, setDraft] = useState(node)

  useEffect(() => {
    setDraft(
      node?.type === 'script_js'
        ? { ...node, script: node.script && prettierJs(node.script) }
        : node
    )
  }, [node])

  const handleChange = (n: NonNullable<typeof node>) => {
    setDraft(v => produce(v, d => Object.assign(d, n)))
  }

  const handleClose = () => setCurrentNode()

  const handleSave = () => {
    draft &&
      updateNode(
        draft?.type === 'script_js'
          ? { ...draft, script: draft.script && prettierJs(draft.script) }
          : draft
      )
    handleClose()
  }

  return (
    <div
      onKeyDown={e => {
        if (e.metaKey && e.key === 's') {
          e.preventDefault()
          e.stopPropagation()
          handleSave()
        }
      }}
    >
      <_Drawer
        visible={Boolean(node) && node?.type !== 'script_js'}
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
        {C && draft && (
          <C
            nodes={nodes}
            ids={ids}
            applicationId={applicationId}
            node={draft}
            onChange={handleChange}
          />
        )}
      </_Drawer>

      <_Modal
        visible={node?.type === 'script_js'}
        title={node && <Title node={node} />}
        closable={false}
        maskClosable={false}
        width="90%"
        onCancel={handleClose}
        onOk={handleSave}
      >
        {C && draft && (
          <C
            nodes={nodes}
            ids={ids}
            applicationId={applicationId}
            node={draft}
            onChange={handleChange}
          />
        )}
      </_Modal>
    </div>
  )
}

const RENDERERS: {
  [key in Node['type'] | Trigger['type']]: ComponentType<{
    nodes: { [key: string]: Trigger | Node }
    ids: string[]
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

const _Modal = styled(Modal)`
  height: 90%;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  margin: auto;

  > .ant-modal-content {
    height: 100%;
    display: flex;
    flex-direction: column;

    > .ant-modal-body {
      flex: 1;
    }
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

function prettierJs(script: string): string {
  return format(script, {
    parser: 'typescript',
    plugins: [parseTypescript],
    printWidth: 100,
    semi: false,
    singleQuote: true,
    arrowParens: 'avoid',
    trailingComma: 'es5',
  })
}
