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

// @ts-ignore
import BackgroundSvg from './bg.svg'

import styled from '@emotion/styled'
import EndNode from './nodes/EndNode'
import { RecoilRoot } from 'recoil'
import { useEffect, useRef } from 'react'
import { State, useSetWorkflow, useWorkflow } from './state'
import NodeRenderer from './NodeRenderer'
import NodeConfigureRenderer from './NodeConfigureRenderer'

export interface WorkflowEditorProps {
  applicationId: string
  value?: State
  onChange?: (value: State) => void
}

export default function WorkflowEditor(props: WorkflowEditorProps) {
  return (
    <RecoilRoot>
      <_WorkflowEditor {...props} />
    </RecoilRoot>
  )
}

const _WorkflowEditor = (props: WorkflowEditorProps) => {
  const setState = useSetWorkflow()
  const state = useWorkflow()
  const ref = useRef<State>()

  useEffect(() => {
    if (ref.current !== props.value) {
      ref.current = props.value || { nodes: {}, ids: [] }
      setState(ref.current)
    }
  }, [props.value])

  useEffect(() => {
    if (ref.current !== state) {
      ref.current = state
      props.onChange?.(state)
    }
  }, [state])

  const { nodes, ids, current } = useWorkflow()

  return (
    <_Container>
      <_Background />

      <_Content>
        {ids.map(id => (
          <NodeRenderer key={id} node={nodes[id]!} selected={current === id} />
        ))}

        <EndNode />
      </_Content>

      <NodeConfigureRenderer applicationId={props.applicationId} />
    </_Container>
  )
}

const _Container = styled.div`
  user-select: none;
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
`

const _Background = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  overflow: hidden;

  &:before {
    content: '';
    display: block;
    position: absolute;
    left: -5px;
    top: -5px;
    right: -5px;
    bottom: -5px;
    background: url(${BackgroundSvg}) 0 0 repeat;
    background-size: 11px;
  }
`

const _Content = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  padding: 64px 200px;
`
