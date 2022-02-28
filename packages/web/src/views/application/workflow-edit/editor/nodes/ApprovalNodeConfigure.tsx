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
import { Modal, Radio, Select, Space, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useToggle } from 'react-use'
import MonacoEditor from '../components/MonacoEditor/MonacoEditor'
import { formatJs } from '../prettier'
import { ApprovalNode, isNode, isTrigger, Node, Trigger } from '../state'
import useApplicationDefines from '../useScriptJsDefines'

export default function ApprovalConfigure({
  nodes,
  ids,
  node,
  applicationId,
  onChange,
}: {
  nodes: { [key: string]: Trigger | Node }
  ids: string[]
  node: ApprovalNode
  applicationId: string
  onChange: (node: Partial<ApprovalNode>) => void
}) {
  const targetOptions = useMemo(() => {
    const options: { nodeId: string; label: string }[] = []

    const index = ids.indexOf(node.id)
    if (index >= 0) {
      for (const id of ids.slice(0, index)) {
        const node = nodes[id]
        if (isTrigger(node)) {
          options.push({ nodeId: node.id, label: `表单事件触发` })
        }
      }
    }

    return options
  }, [nodes, ids, node])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Typography.Title level={5}>审批对象</Typography.Title>

        <Select
          value={node.target?.nodeId}
          onChange={nodeId => onChange({ target: { nodeId } })}
          style={{ width: '100%' }}
        >
          {targetOptions.map(option => (
            <Select.Option key={option.nodeId} value={option.nodeId} children={option.label} />
          ))}
        </Select>
      </div>

      <div>
        <Typography.Title level={5}>审批人</Typography.Title>

        <Radio.Group
          value={node.approvals?.type}
          onChange={e => onChange({ approvals: { type: e.target.value } })}
        >
          <Radio value="script_js">JavaScript</Radio>
        </Radio.Group>

        {node.approvals?.type === 'script_js' && (
          <ApprovalsScript
            nodes={nodes}
            ids={ids}
            node={node}
            applicationId={applicationId}
            onChange={onChange}
          />
        )}
      </div>

      <div>
        <Typography.Title level={5}>多人审批方式</Typography.Title>

        <Radio.Group
          value={node.multipleConditionType}
          onChange={e => onChange({ multipleConditionType: e.target.value })}
        >
          <Radio value="all">会签（需所有审批人同意）</Radio>
          <Radio value="or">或签（以第一个审批人的操作为准）</Radio>
        </Radio.Group>
      </div>
    </Space>
  )
}

const ApprovalsScript = ({
  nodes,
  ids,
  node,
  applicationId,
  onChange,
}: {
  nodes: { [key: string]: Trigger | Node }
  ids: string[]
  node: ApprovalNode
  applicationId: string
  onChange: (node: Partial<ApprovalNode>) => void
}) => {
  const trigger = nodes[ids[0]!]
  const applicationDefines = useApplicationDefines({
    applicationId,
    trigger: isNode(trigger) ? undefined : trigger,
  })

  const defines = useMemo(() => {
    return applicationDefines.concat({
      content: `
declare interface Outputs {
  /**
   * 审批人 id 列表
   */
  approvals?: string[]
}
`,
    })
  }, [applicationDefines])

  const [visible, toggleVisible] = useToggle(false)
  const [script, setScript] = useState('')

  useEffect(() => {
    if (node.approvals?.type === 'script_js') {
      setScript(formatJs(node.approvals.script || ''))
    } else {
      setScript('')
    }
  }, [node.approvals])

  const handleSave = () => {
    onChange({ approvals: { type: 'script_js', script: formatJs(script) } })
    toggleVisible(false)
  }

  if (node.approvals?.type !== 'script_js') {
    return null
  }

  return (
    <>
      <_Script onClick={toggleVisible}>{node.approvals.script}</_Script>
      <div
        onKeyDown={e => {
          if (e.metaKey && e.key === 's') {
            e.preventDefault()
            e.stopPropagation()
            handleSave()
          }
        }}
      >
        <_Modal
          title="审批人 - JavaScript"
          visible={visible}
          closable={false}
          maskClosable={false}
          width=""
          onOk={handleSave}
          onCancel={toggleVisible}
        >
          <MonacoEditor value={script || defaultScript} extraLibs={defines} onChange={setScript} />
        </_Modal>
      </div>
    </>
  )
}

const _Script = styled.div`
  line-height: 32px;
  min-height: 32px;
  color: #111f2c;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 4px;
  padding: 4px 8px;
  margin-top: 8px;
  cursor: pointer;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;

  &:hover {
    outline: 1px solid var(--ant-primary-color-outline);
  }

  &:empty {
    &:before {
      content: '点击编辑代码';
      color: #aaa;
    }
  }
`

const _Modal = styled(Modal)`
  height: 90%;
  width: 90%;
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

const defaultScript = `\
export default async function () {
  // Set approvals
  outputs.approvals = ['user id 1', 'user id 2']
}
`
