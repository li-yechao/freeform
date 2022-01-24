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

import { CaretDownOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { gql, QueryHookOptions, useMutation, useQuery } from '@apollo/client'
import styled from '@emotion/styled'
import { Box } from '@mui/system'
import { Dropdown, Menu, message, Tabs, Typography } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { Route, Routes, useNavigate, useParams } from 'react-router-dom'
import Popprompt, { PoppromptProps } from '../../components/Modal/Popprompt'
import NetworkIndicator from '../../components/NetworkIndicator'

export default function FormView() {
  const { applicationId, formId } = useParams<{ applicationId: string; formId: string }>()
  if (!applicationId || !formId) {
    throw new Error(`Required params applicationId or formId is missing`)
  }

  const {
    data: { application } = {},
    loading,
    error,
  } = useApplicationFormViews({ variables: { applicationId, formId } })
  if (error) {
    throw error
  }

  return (
    <>
      <NetworkIndicator in={loading} />

      {application && (
        <_FormView>
          <Routes>
            <Route index element={<FormHeader app={application} />} />
            <Route path=":viewId" element={<FormHeader app={application} />} />
          </Routes>

          <Routes>
            <Route index element={<RedirectToFirstView app={application} />} />
          </Routes>
        </_FormView>
      )}
    </>
  )
}

const RedirectToFirstView = ({ app }: { app: ApplicationForm }) => {
  const first = app.form.views?.at(0)
  const navigate = useNavigate()

  useEffect(() => {
    if (first) {
      navigate(first.id, { replace: true })
    }
  }, [first])

  return null
}

const _FormView = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: white;
  border-left: 1px solid #efefef;
`

const FormHeader = ({ app }: { app: ApplicationForm }) => {
  const { viewId } = useParams<'viewId'>()
  const navigate = useNavigate()

  const [deleteView] = useMutation(
    gql`
      mutation DeleteView($applicationId: String!, $formId: String!, $viewId: String!) {
        deleteView(applicationId: $applicationId, formId: $formId, viewId: $viewId)
      }
    `,
    { refetchQueries: ['ApplicationFormViews'] }
  )

  const handleDelete = (view: { id: string }) => {
    const index = app.form.views?.findIndex(i => i.id === view.id)
    const next =
      index !== undefined
        ? app.form.views?.at(index + 1) ?? app.form.views?.at(index - 1) ?? app.form.views?.at(-1)
        : undefined

    deleteView({ variables: { applicationId: app.id, formId: app.form.id, viewId: view.id } })
      .then(() => {
        if (next) {
          navigate(`../${next.id}`)
        } else {
          navigate(`..`)
        }
        message.success('删除成功')
      })
      .catch(error => message.error(error.message))
  }

  const [createView, { error }] = useMutation<
    { createView: { id: string; name?: string; fields?: { fieldId: string }[] } },
    {
      applicationId: string
      formId: string
      input: { name?: string; fields: { fieldId: string }[] }
    }
  >(
    gql`
      mutation CreateView($applicationId: String!, $formId: String!, $input: ViewInput!) {
        createView(applicationId: $applicationId, formId: $formId, input: $input) {
          id
          name
          fields {
            fieldId
          }
        }
      }
    `,
    { refetchQueries: ['ApplicationFormViews'] }
  )

  useEffect(() => {
    if (error) {
      message.error(error.message)
    }
  }, [error])

  const [nameUpdaterTarget, setNameUpdaterTarget] = useState<{ id: string; name?: string }>()

  return (
    <>
      <Box px={2} py={1}>
        <Typography.Title level={5}>{app.form.name || '未命名'}</Typography.Title>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Tabs
          type="editable-card"
          size="small"
          activeKey={viewId}
          onChange={key => navigate(`../${key}`, { replace: true })}
          onEdit={(_, t) =>
            t === 'add' &&
            createView({
              variables: {
                applicationId: app.id,
                formId: app.form.id,
                input: {
                  fields:
                    app.form.layout?.rows.flatMap(row =>
                      row.children.map(col => ({ fieldId: col.fieldId }))
                    ) ?? [],
                },
              },
            }).then(res => {
              const viewId = res.data?.createView.id
              if (viewId) {
                navigate(`../${viewId}`)
              }
            })
          }
        >
          {app.form.views?.map(view => (
            <Tabs.TabPane
              key={view.id}
              tabKey={view.id}
              closable={viewId === view.id}
              closeIcon={
                <Dropdown
                  arrow
                  trigger={['click']}
                  overlay={() => (
                    <Menu>
                      <Menu.Item
                        key="rename"
                        icon={<EditOutlined />}
                        onClick={() => setNameUpdaterTarget(view)}
                      >
                        重命名
                      </Menu.Item>
                      <Menu.Item
                        key="delete"
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(view)}
                      >
                        删除
                      </Menu.Item>
                    </Menu>
                  )}
                >
                  <CaretDownOutlined />
                </Dropdown>
              }
              tab={
                <ViewNameUpdater
                  appId={app.id}
                  formId={app.form.id}
                  view={view}
                  visible={nameUpdaterTarget?.id === view.id}
                  onVisibleChange={() => setNameUpdaterTarget(undefined)}
                >
                  <span>{view.name || '未命名'}</span>
                </ViewNameUpdater>
              }
            />
          ))}
        </Tabs>
      </Box>
    </>
  )
}

interface ApplicationForm {
  id: string
  createdAt: number
  updatedAt?: number
  name?: string

  form: {
    id: string
    createdAt: number
    updatedAt?: number
    name?: string
    description?: string

    fields?: {
      id: string
      type: string
      name?: string
      label: string
      meta?: { [key: string]: any }
    }[]

    layout?: {
      rows: {
        children: {
          fieldId: string
        }[]
      }[]
    }

    views?: {
      id: string
      name?: string
      fields?: { fieldId: string }[]
    }[]
  }
}

const useApplicationFormViews = (
  options?: QueryHookOptions<
    { application: ApplicationForm },
    { applicationId: string; formId: string }
  >
) =>
  useQuery(
    gql`
      query ApplicationFormViews($applicationId: String!, $formId: String!) {
        application(applicationId: $applicationId) {
          id
          createdAt
          updatedAt
          name

          form(formId: $formId) {
            id
            createdAt
            updatedAt
            name
            description

            fields {
              id
              type
              name
              label
              state
              meta
            }

            layout {
              rows {
                children {
                  fieldId
                }
              }
            }

            views {
              id
              name
              fields {
                fieldId
              }
            }
          }
        }
      }
    `,
    options
  )

const ViewNameUpdater = ({
  appId,
  formId,
  view,
  ...props
}: {
  appId: string
  formId: string
  view: { id: string; name?: string }
  onClose?: () => void | null
} & PoppromptProps) => {
  const [updateView, { loading, error }] = useMutation<
    { updateView: { id: string; name?: string } },
    { applicationId: string; formId: string; viewId: string; input: { name: string } }
  >(gql`
    mutation UpdateView(
      $applicationId: String!
      $formId: String!
      $viewId: String!
      $input: ViewInput!
    ) {
      updateView(applicationId: $applicationId, formId: $formId, viewId: $viewId, input: $input) {
        id
        name
      }
    }
  `)

  const updateName = useCallback(
    (name: string) => {
      if (loading) {
        return
      }
      updateView({
        variables: {
          applicationId: appId,
          formId,
          viewId: view.id,
          input: { name },
        },
      }).then(() => {
        props.onVisibleChange?.(false)
      })
    },
    [view.id, updateView, loading]
  )

  return <Popprompt {...props} value={view.name} error={error} onSubmit={updateName} />
}
