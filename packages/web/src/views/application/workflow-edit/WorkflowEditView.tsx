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
import { Button, message } from 'antd'
import equal from 'fast-deep-equal'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { HeaderAction, useHeaderActionsCtrl } from '../../../state/header'
import useOnSave from '../../../utils/useOnSave'
import { isNode, State } from './editor/state'
import WorkflowEditor from './editor/WorkflowEditor'
import { useApplication, useUpdateWorkflow } from './graphql'

export default function WorkflowEditView() {
  const { applicationId, workflowId } = useParams<'applicationId' | 'workflowId'>()
  if (!applicationId || !workflowId) {
    throw new Error('Required parameter applicationId or workflowId is missing')
  }

  const { data: { application } = {} } = useApplication({
    variables: { applicationId, workflowId },
  })
  const workflow = application?.workflow

  const valueRef = useRef<State>()
  const [value, setValue] = useState<State>()

  useEffect(() => {
    const nodes: State['nodes'] = {}
    const ids: string[] = []

    if (workflow) {
      nodes[workflow.trigger.id] = workflow.trigger
      ids.push(workflow.trigger.id)

      for (const n of workflow.children) {
        nodes[n.id] = n
        ids.push(n.id)
      }

      valueRef.current = { nodes, ids }
      setValue(valueRef.current)
    }
  }, [workflow])

  const headerActionsCtrl = useHeaderActionsCtrl()

  useEffect(() => {
    const exportButton: HeaderAction<React.ComponentProps<typeof SaveButton>> = {
      key: 'WorkflowEditView-SaveButton',
      component: SaveButton,
      props: {
        applicationId,
        workflowId,
        value,
        disabled:
          equal(valueRef.current?.nodes, value?.nodes) && equal(valueRef.current?.ids, value?.ids),
      },
    }
    headerActionsCtrl.set(exportButton)

    return () => headerActionsCtrl.remove(exportButton)
  }, [applicationId, workflowId, value])

  return (
    <_Container>
      {workflow && (
        <WorkflowEditor applicationId={applicationId} value={value} onChange={setValue} />
      )}
    </_Container>
  )
}

const SaveButton = ({
  applicationId,
  workflowId,
  value,
  disabled,
}: {
  applicationId: string
  workflowId: string
  value?: State
  disabled?: boolean
}) => {
  const [updateWorkflow, { loading, error, data }] = useUpdateWorkflow()

  const handleUpdate = () => {
    if (!value) {
      return
    }

    const triggerId = value.ids[0]
    if (!triggerId) {
      throw new Error(`Nodes is empty`)
    }
    const trigger = value.nodes[triggerId]
    if (!trigger || trigger.type !== 'form_trigger') {
      throw new Error(`Invalid trigger ${trigger?.type}`)
    }

    updateWorkflow({
      variables: {
        applicationId,
        workflowId,
        input: {
          trigger,
          children: value.ids.slice(1).map(id => {
            const node = value.nodes[id]
            if (!isNode(node)) {
              throw new Error(`Not ${id} is not found`)
            }
            return node
          }),
        },
      },
    })
  }

  useEffect(() => {
    if (error) {
      message.error(error.message)
    } else if (data?.updateWorkflow) {
      message.success('????????????')
    }
  }, [error, data])

  useOnSave(() => {
    handleUpdate()
  }, [handleUpdate])

  return (
    <Button loading={loading} disabled={disabled} onClick={handleUpdate}>
      ??????
    </Button>
  )
}

const _Container = styled.div`
  position: absolute;
  left: 0;
  top: 48px;
  right: 0;
  bottom: 0;
  overflow: hidden;
`
