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

import produce from 'immer'
import { customAlphabet } from 'nanoid'
import { useCallback } from 'react'
import { atom, useRecoilValue, useSetRecoilState } from 'recoil'

export const generateNodeId = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 16)

export interface State {
  nodes: { [key: string]: Node | Trigger }
  ids: string[]
  current?: string
}

export type Trigger = FormTrigger

export interface FormTrigger {
  id: string
  type: 'form_trigger'
  formId?: string
  actions?: FormTriggerAction[]
}

export type FormTriggerAction = { type: 'create' }

export type Node = ScriptJsNode

export function isNode(n: any): n is Node {
  return ['script_js'].includes(n?.type)
}

export interface ScriptJsNode {
  id: string
  type: 'script_js'
  script?: string
}

const workflowState = atom<State>({
  key: 'workflow-state',
  default: { nodes: {}, ids: [] },
})

export function useWorkflow() {
  return useRecoilValue(workflowState)
}

export function useSetWorkflow() {
  return useSetRecoilState(workflowState)
}

export function useCurrentNode() {
  const { nodes, current } = useWorkflow()

  return nodes[current!]
}

export function useSetCurrentNode() {
  const setWorkflow = useSetWorkflow()

  return useCallback((current?: string) => setWorkflow(v => ({ ...v, current })), [setWorkflow])
}

export function useCreateNode() {
  const setWorkflow = useSetWorkflow()

  return useCallback(
    ({ currentId, node }: { currentId: string; node: Node }) =>
      setWorkflow(v =>
        produce(v, draft => {
          const index = draft.ids.indexOf(currentId)
          if (index >= 0) {
            draft.nodes[node.id] = node
            draft.ids.splice(index + 1, 0, node.id)
          }
          draft.current = undefined
        })
      ),
    [setWorkflow]
  )
}

export function useUpdateNode() {
  const setWorkflow = useSetWorkflow()

  return useCallback(
    (node: Partial<Node | Trigger> & { id: string }) =>
      setWorkflow(v =>
        produce(v, draft => {
          Object.assign(draft.nodes[node.id], node)
        })
      ),
    [setWorkflow]
  )
}

export function useDeleteNode() {
  const setWorkflow = useSetWorkflow()

  return useCallback(
    (id: string) =>
      setWorkflow(v =>
        produce(v, draft => {
          const index = draft.ids.indexOf(id)
          if (index >= 0) {
            delete draft.nodes[id]
            draft.ids.splice(index, 1)
          }
          if (draft.current === id) {
            draft.current = undefined
          }
        })
      ),
    [setWorkflow]
  )
}
