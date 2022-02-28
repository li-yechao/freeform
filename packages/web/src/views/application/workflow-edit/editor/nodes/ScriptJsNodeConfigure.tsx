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
import MonacoEditor from '../components/MonacoEditor/MonacoEditor'
import { isNode, Node, ScriptJsNode, Trigger } from '../state'
import useApplicationDefines from '../useScriptJsDefines'

export default function ScriptJsNodeConfigure({
  nodes,
  ids,
  applicationId,
  node,
  onChange,
}: {
  nodes: { [key: string]: Trigger | Node }
  ids: string[]
  applicationId: string
  node: ScriptJsNode
  onChange: (node: Partial<ScriptJsNode>) => void
}) {
  const trigger = nodes[ids[0]!]
  const defines = useApplicationDefines({
    applicationId,
    trigger: isNode(trigger) ? undefined : trigger,
  })

  return (
    <_MonacoEditor
      value={node.script || defaultScript}
      extraLibs={defines}
      onChange={script => onChange({ script })}
    />
  )
}

const _MonacoEditor = styled(MonacoEditor)`
  border: 1px solid #d9d9d9;
  border-radius: 2px;
`

const defaultScript = `\
export default async function () {
  // Your business code
}
`
