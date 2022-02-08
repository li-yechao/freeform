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
import { ScriptJsNode } from '../state'

export default function ScriptJsNodeConfigure({
  node,
  onChange,
}: {
  node: ScriptJsNode
  onChange: (node: Partial<ScriptJsNode>) => void
}) {
  return (
    <_Container>
      <_MonacoEditor
        language="javascript"
        value={node.script}
        onChange={script => onChange({ script })}
      />
    </_Container>
  )
}

const _Container = styled.div`
  height: 50vh;
  min-height: 200px;
`

const _MonacoEditor = styled(MonacoEditor)`
  border: 1px solid #d9d9d9;
  border-radius: 2px;
`