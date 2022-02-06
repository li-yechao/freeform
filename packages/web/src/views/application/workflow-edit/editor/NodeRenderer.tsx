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
import { ReactNode, useMemo } from 'react'
import NodeIcon from './components/NodeIcon'
import NodeRender from './components/NodeRender'
import PlusContent from './components/PlusContent'
import {
  FormTriggerAction,
  generateNodeId,
  Node,
  Trigger,
  useCreateNode,
  useDeleteNode,
  useSetCurrentNode,
} from './state'

export default function NodeRenderer({
  node,
  selected,
}: {
  node: Node | Trigger
  selected?: boolean
}) {
  const createNode = useCreateNode()
  const deleteNode = useDeleteNode()
  const setCurrentNode = useSetCurrentNode()

  const plusContent = useMemo(() => {
    const buttons = [
      {
        title: '开发者',
        children: [{ type: 'script_js', icon: <CodeOutlined />, title: 'JavaScript' }],
      },
    ]
    return (
      <PlusContent
        buttons={buttons}
        onClick={({ type }) => {
          const newNode: Node = { id: generateNodeId(), type: type as any }
          createNode({ currentId: node.id, node: newNode })
          setTimeout(() => {
            document.getElementById(`node-${newNode.id}`)?.scrollIntoView({ behavior: 'smooth' })
            document.getElementById(`node-${newNode.id}`)?.focus()
          })
        }}
      />
    )
  }, [node.id])

  let icon: ReactNode | undefined
  let name: string | undefined
  let description: string | undefined

  switch (node.type) {
    case 'form_trigger': {
      icon = (
        <NodeIcon>
          <FileTextOutlined />
        </NodeIcon>
      )
      name = '表单事件触发'
      description = node.actions?.map(actionText).join('、')
      break
    }
    case 'script_js': {
      icon = (
        <NodeIcon>
          <CodeOutlined />
        </NodeIcon>
      )
      name = 'JavaScript'
      description = node.script
      break
    }
  }

  const handleDelete = node.type.endsWith('_trigger') ? undefined : () => deleteNode(node.id)

  const handleClick = () => setCurrentNode(node.id)

  return (
    <NodeRender
      id={`node-${node.id}`}
      plusContent={plusContent}
      icon={icon}
      name={name}
      description={description}
      selected={selected}
      onDelete={handleDelete}
      onClick={handleClick}
    />
  )
}

function actionText(action: FormTriggerAction): string {
  if (action.type === 'create') {
    return '创建成功'
  }
  throw new Error(`Invalid form tirgger action ${action}`)
}
