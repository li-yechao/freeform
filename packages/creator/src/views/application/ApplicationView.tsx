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

import { MoreOutlined, PlusOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { gql, QueryHookOptions, useMutation, useQuery } from '@apollo/client'
import styled from '@emotion/styled'
import { Button, Dropdown, Menu, message } from 'antd'
import { useCallback, useState } from 'react'
import { Route, Routes, useNavigate, useParams } from 'react-router-dom'
import AsideLayout from '../../components/Layout/AsideLayout'
import Popprompt, { PoppromptProps } from '../../components/Modal/Popprompt'
import NetworkIndicator from '../../components/NetworkIndicator'
import { NotFoundViewLazy } from '../error'
import { FormLazyView } from '../form'

export default function ApplicationView() {
  const { applicationId } = useParams<{ applicationId: string }>()
  if (!applicationId) {
    throw new Error(`Required params applicationId is missing`)
  }

  const application = useApplication({ variables: { id: applicationId } })

  const app = application.data?.application

  return (
    <>
      <NetworkIndicator in={application.loading} />

      {app && (
        <AsideLayout
          sx={{ pt: 6 }}
          left={
            <Routes>
              <Route index element={<FormList app={app} />} />
              <Route path="form/:formId/*" element={<FormList app={app} />} />
            </Routes>
          }
        >
          <ApplicationRoutes />
        </AsideLayout>
      )}
    </>
  )
}

const FormList = ({ app }: { app: Application }) => {
  const { formId } = useParams<'formId'>()
  const navigate = useNavigate()

  const [createForm] = useMutation(
    gql`
      mutation CreateForm($applicationId: String!, $input: CreateFormInput!) {
        createForm(applicationId: $applicationId, input: $input) {
          id
          createdAt
          updatedAt
          name
          description
        }
      }
    `,
    { refetchQueries: ['ApplicationForms'] }
  )

  const [deleteForm] = useMutation<
    { deleteForm: boolean },
    { applicationId: string; formId: string }
  >(
    gql`
      mutation DeleteForm($applicationId: String!, $formId: String!) {
        deleteForm(applicationId: $applicationId, formId: $formId)
      }
    `,
    { refetchQueries: ['ApplicationForms'] }
  )

  const [nameUpdaterTarget, setNameUpdaterTarget] = useState<{ id: string; name?: string }>()

  const handleDelete = (form: { id: string }) => {
    deleteForm({ variables: { applicationId: app.id, formId: form.id } }).then(() =>
      message.success('删除成功')
    )
  }

  const handleToEdit = (form: { id: string }) => {
    navigate(`/application/${app.id}/form/${form.id}/edit`)
  }

  return (
    <_Menu activeKey={formId} selectedKeys={formId ? [formId] : undefined}>
      {app.forms.map(form => (
        <Menu.Item
          key={form.id}
          icon={<UnorderedListOutlined />}
          onClick={() => navigate(`/application/${app.id}/form/${form.id}`)}
        >
          <span>
            <FormNameUpdater
              appId={app.id}
              form={form}
              visible={nameUpdaterTarget?.id === form.id}
              onVisibleChange={() => setNameUpdaterTarget(undefined)}
            >
              <span>{form.name || '未命名'}</span>
            </FormNameUpdater>
          </span>

          <div className="hover_visible" onClick={e => e.stopPropagation()}>
            <Dropdown
              arrow
              trigger={['click']}
              overlay={() => (
                <Menu>
                  <Menu.Item key="rename" onClick={() => setNameUpdaterTarget(form)}>
                    重命名
                  </Menu.Item>
                  <Menu.Item key="edit" onClick={() => handleToEdit(form)}>
                    编辑表单
                  </Menu.Item>
                  <Menu.Item key="delete" onClick={() => handleDelete(form)}>
                    删除
                  </Menu.Item>
                </Menu>
              )}
            >
              <Button size="small" type="text" shape="circle">
                <MoreOutlined />
              </Button>
            </Dropdown>
          </div>
        </Menu.Item>
      ))}
      <Menu.Item
        key="add"
        icon={<PlusOutlined />}
        onClick={() => createForm({ variables: { applicationId: app.id, input: {} } })}
      >
        新建表单
      </Menu.Item>
    </_Menu>
  )
}

const ApplicationRoutes = () => {
  return (
    <Routes>
      <Route index element={<div />} />
      <Route path="form/:formId/*" element={<FormLazyView />} />
      <Route path="*" element={<NotFoundViewLazy />} />
    </Routes>
  )
}

interface Application {
  id: string
  createdAt: number
  updatedAt?: number
  name?: string

  forms: Form[]
}

interface Form {
  id: string
  createdAt: number
  updated?: number
  name?: string
  description?: string
}

const useApplication = (options?: QueryHookOptions<{ application: Application }, { id: string }>) =>
  useQuery(
    gql`
      query ApplicationForms($id: String!) {
        application(id: $id) {
          id
          createdAt
          updatedAt
          name

          forms {
            id
            createdAt
            updatedAt
            name
            description
          }
        }
      }
    `,
    options
  )

const _Menu = styled(Menu)`
  border-right: 0;

  > .ant-menu-item {
    display: flex;
    align-items: center;
    margin-bottom: 0 !important;
    margin: 0;

    > .ant-menu-title-content {
      flex: 1;
      overflow: hidden;
      white-space: nowrap;
      display: flex;
      align-items: center;

      > span {
        flex: 1;
        overflow: hidden;
      }

      > .hover_visible {
        > .ant-dropdown-trigger {
          display: none;
        }

        > .ant-dropdown-open {
          display: block;
        }
      }
    }

    &:hover {
      .hover_visible {
        .ant-dropdown-trigger {
          display: block;
        }
      }
    }
  }
`

const FormNameUpdater = ({
  appId,
  form,
  ...props
}: {
  appId: string
  form: { id: string; name?: string }
} & PoppromptProps) => {
  const [updateForm, { loading, error }] = useMutation<
    { updateForm: { id: string; updatedAt?: number; name?: string } },
    { applicationId: string; formId: string; input: { name: string } }
  >(gql`
    mutation UpdateForm($applicationId: String!, $formId: String!, $input: UpdateFormInput!) {
      updateForm(applicationId: $applicationId, formId: $formId, input: $input) {
        id
        updatedAt
        name
      }
    }
  `)

  const updateName = useCallback(
    (name: string) => {
      if (loading) {
        return
      }
      updateForm({
        variables: { applicationId: appId, formId: form.id, input: { name } },
      }).then(() => props.onVisibleChange?.(false))
    },
    [appId, form.id, updateForm, loading]
  )

  return <Popprompt {...props} value={form.name} error={error} onSubmit={updateName} />
}
