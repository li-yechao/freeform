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

import { PlusOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { Button, message, Popconfirm, Table, TableProps } from 'antd'
import { MouseEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { FormattedDate } from 'react-intl'
import { useNavigate, useParams } from 'react-router-dom'
import Popprompt, { PoppromptProps } from '../../../components/Modal/Popprompt'
import { HeaderAction, useHeaderActionsCtrl } from '../../../state/header'
import { generateNodeId } from '../workflow-edit/editor/state'
import {
  useApplication,
  useCreateWorkflow,
  useDeleteWorkflow,
  useUpdateWorkflow,
  Workflow,
} from './graphql'

export default function ApplicationWorkflowView() {
  const { applicationId } = useParams<'applicationId'>()
  if (!applicationId) {
    throw new Error('Required parameter applicationId is missing')
  }

  const navigate = useNavigate()
  const { data: { application } = {} } = useApplication({ variables: { applicationId } })
  const workflows = application?.workflows

  const columns = useMemo<TableProps<Workflow>['columns']>(() => {
    return [
      {
        title: '名称',
        dataIndex: 'name',
        ellipsis: true,
        render: (_, workflow) => <Name applicationId={applicationId} workflow={workflow} />,
      },
      {
        title: '创建于',
        dataIndex: 'createdAt',
        ellipsis: true,
        render: v => (
          <FormattedDate
            value={v}
            year="numeric"
            month="numeric"
            day="numeric"
            hour="numeric"
            hour12={false}
            minute="numeric"
          />
        ),
      },
      {
        title: '更新于',
        dataIndex: 'updatedAt',
        ellipsis: true,
        render: (v, r) => (
          <FormattedDate
            value={v || r.createdAt}
            year="numeric"
            month="numeric"
            day="numeric"
            hour="numeric"
            hour12={false}
            minute="numeric"
          />
        ),
      },
      {
        title: '操作',
        width: 120,
        align: 'right',
        render: (_, r) => (
          <>
            <Button
              type="link"
              onClick={() => navigate(`/application/${applicationId}/workflow/${r.id}/edit`)}
            >
              编辑
            </Button>
            <WorkflowDeleter applicationId={applicationId} workflowId={r.id} />
          </>
        ),
      },
    ]
  }, [])

  return (
    <>
      <WorkflowCreator applicationId={applicationId} />

      <_Container>
        <Table
          sticky={{ offsetHeader: 48 }}
          rowKey="id"
          size="small"
          columns={columns}
          dataSource={workflows}
          pagination={false}
        />
      </_Container>
    </>
  )
}

const Name = ({ applicationId, workflow }: { applicationId: string; workflow: Workflow }) => {
  const [updateWorkflow] = useUpdateWorkflow()

  const [nameUpdaterProps, setNameUpdaterProps] = useState<PoppromptProps>()

  const handleToggleNameUpdater = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation()

      setNameUpdaterProps({
        value: workflow.name,
        visible: true,
        onSubmit: name => {
          updateWorkflow({
            variables: {
              applicationId,
              workflowId: workflow.id,
              input: { name },
            },
          })
            .then(() => setNameUpdaterProps(undefined))
            .catch(error => {
              setNameUpdaterProps(props => ({ ...props, error }))
              throw error
            })
        },
        onVisibleChange: () => setNameUpdaterProps(undefined),
      })
    },
    [workflow]
  )

  return (
    <Popprompt {...nameUpdaterProps}>
      <span onClick={handleToggleNameUpdater}>{workflow.name || '未命名'}</span>
    </Popprompt>
  )
}

const WorkflowCreator = ({ applicationId }: { applicationId: string }) => {
  const headerActionsCtrl = useHeaderActionsCtrl()
  const [createWorkflow] = useCreateWorkflow()

  useEffect(() => {
    const workflowButton: HeaderAction<React.ComponentProps<typeof Button>> = {
      key: 'ApplicationView-WorkflowButton',
      component: Button,
      props: {
        children: '新建工作流',
        icon: <PlusOutlined />,
        type: 'primary',
        onClick: () => {
          createWorkflow({
            variables: {
              applicationId,
              input: { trigger: { id: generateNodeId(), type: 'form_trigger' }, children: [] },
            },
          })
            .then(() => message.success('创建成功'))
            .catch(error => {
              message.error(error.message)
              throw error
            })
        },
      },
    }
    headerActionsCtrl.set(workflowButton)

    return () => headerActionsCtrl.remove(workflowButton)
  }, [applicationId])

  return null
}

const WorkflowDeleter = ({
  applicationId,
  workflowId,
}: {
  applicationId: string
  workflowId: string
}) => {
  const [deleteWorkflow] = useDeleteWorkflow()

  return (
    <span onClick={e => e.stopPropagation()}>
      <Popconfirm
        title="确定删除？"
        okText="删除"
        icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
        onConfirm={() =>
          deleteWorkflow({ variables: { applicationId, workflowId } }).catch(error => {
            message.error(error.message)
            throw error
          })
        }
      >
        <a>删除</a>
      </Popconfirm>
    </span>
  )
}

const _Container = styled.div`
  background-color: #ffffff;
  max-width: 800px;
  margin: 16px auto;
  padding-bottom: 64px;
`
