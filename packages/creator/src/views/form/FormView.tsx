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

import {
  CaretDownOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons'
import { gql, QueryHookOptions, useMutation, useQuery } from '@apollo/client'
import styled from '@emotion/styled'
import { Box } from '@mui/system'
import {
  Breadcrumb,
  Button,
  Dropdown,
  Menu,
  message,
  Modal,
  Popconfirm,
  Space,
  Table,
  TableColumnsType,
  Tabs,
  Typography,
} from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { useToggle } from 'react-use'
import FormRenderer, { FormRendererProps } from '../../components/FormRenderer'
import { Value } from '../../components/FormRenderer/state'
import Popprompt, { PoppromptProps } from '../../components/Modal/Popprompt'
import NetworkIndicator from '../../components/NetworkIndicator'
import { notEmpty } from '../../utils/array'

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
            <Route path=":viewId" element={<FormTable app={application} />} />
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

  const [recordCreatorVisible, toggleRecordCreatorVisible] = useToggle(false)

  return (
    <>
      <RecordCreator
        app={app}
        visible={recordCreatorVisible}
        onCancel={toggleRecordCreatorVisible}
      />

      <Box px={2} py={1} sx={{ display: 'flex' }}>
        <Typography.Title level={5}>{app.form.name || '未命名'}</Typography.Title>
        <Box flex={1} />
        <Button
          type="primary"
          shape="round"
          icon={<PlusOutlined />}
          onClick={toggleRecordCreatorVisible}
        >
          记录
        </Button>
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

const RecordCreator = ({
  app,
  visible,
  onCancel,
}: {
  app: ApplicationForm
  visible?: boolean
  onCancel?: () => void
}) => {
  const [createRecord, { loading }] = useMutation<
    { createRecord: { id: string } },
    { applicationId: string; formId: string; input: { data: { [key: string]: { value: any } } } }
  >(
    gql`
      mutation CreateRecord($applicationId: String!, $formId: String!, $input: CreateRecordInput!) {
        createRecord(applicationId: $applicationId, formId: $formId, input: $input) {
          id
        }
      }
    `,
    { refetchQueries: ['Records'] }
  )

  const formProps = useMemo<FormRendererProps>(() => {
    return {
      fields:
        app.form.fields?.reduce<FormRendererProps['fields']>(
          (res, field) => Object.assign(res, { [field.id]: field }),
          {}
        ) ?? {},
      layout: app.form.layout?.rows.map(row => row.children.map(col => col.fieldId)) ?? [],
    }
  }, [app])

  // TODO: initialize field value
  const [value, setValue] = useState<Value>(() => ({ data: {} }))

  useEffect(() => {
    if (visible) {
      setValue(() => ({ data: {} }))
    }
  }, [visible])

  const handleSubmit = () => {
    if (loading) {
      return
    }
    createRecord({
      variables: { applicationId: app.id, formId: app.form.id, input: { data: value.data } },
    })
      .then(() => {
        message.success('创建成功')
        onCancel?.()
      })
      .catch(error => {
        message.error(error.message)
      })
  }

  return (
    <_Modal
      title="创建记录"
      centered
      destroyOnClose
      visible={visible}
      footer={
        <>
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            提交
          </Button>
        </>
      }
      onCancel={onCancel}
    >
      <FormRenderer {...formProps} value={value} onChange={setValue} />
    </_Modal>
  )
}

const _Modal = styled(Modal)`
  height: 80%;
  width: 50% !important;
  max-width: 680px;

  .ant-modal-content {
    height: 100%;
    display: flex;
    flex-direction: column;

    .ant-modal-body {
      flex: 1;
      overflow: auto;
    }
  }
`

const FormTable = ({ app }: { app: ApplicationForm }) => {
  const { viewId } = useParams<'viewId'>()
  if (!viewId) {
    throw new Error(`Required parameter viewId is missing`)
  }

  const view = useMemo(() => app.form.views?.find(i => i.id === viewId), [app, viewId])

  const columns = useMemo(() => {
    const columns: TableColumnsType<{ id: string }> | undefined = view?.fields
      ?.map(({ fieldId }) => app.form.fields?.find(f => f.id === fieldId))
      .filter(notEmpty)
      .map(field => ({
        title: field.label,
        dataIndex: ['data', field.id, 'value'],
        ellipsis: true,
      }))

    columns?.push({
      title: '操作',
      width: 80,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <RecordDeleter appId={app.id} formId={app.form.id} recordId={record.id} />
        </Space>
      ),
    })

    return columns ?? []
  }, [view])

  const [{ page, limit }, setPage] = useState({ page: 0, limit: 10 })

  const { data } = useQuery<
    {
      application: {
        form: {
          records: {
            nodes: { id: string; createdAt: number; updatedAt?: number; data: any }[]
            pageInfo: { count: number }
          }
        }
      }
    },
    {
      applicationId: string
      formId: string
      viewId: string
      page: number
      limit: number
    }
  >(
    gql`
      query Records(
        $applicationId: String!
        $formId: String!
        $viewId: String!
        $page: Int!
        $limit: Int!
      ) {
        application(applicationId: $applicationId) {
          form(formId: $formId) {
            records(viewId: $viewId, page: $page, limit: $limit) {
              nodes {
                id
                createdAt
                updatedAt
                data
              }

              pageInfo {
                count
              }
            }
          }
        }
      }
    `,
    { variables: { applicationId: app.id, formId: app.form.id, viewId, page, limit } }
  )

  const [currentRecord, setCurrentRecord] = useState<{ id: string }>()

  return (
    <Box px={2}>
      <Table
        bordered
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={data?.application.form.records.nodes ?? []}
        onRow={record => ({
          onClick: () => setCurrentRecord(record),
        })}
        pagination={{
          current: page + 1,
          pageSize: limit,
          total: data?.application.form.records.pageInfo.count,
          showSizeChanger: true,
          onChange: (page, limit) => setPage({ page: page - 1, limit }),
        }}
      />

      {currentRecord && (
        <RecordUpdater
          appId={app.id}
          formId={app.form.id}
          viewId={viewId}
          recordId={currentRecord.id}
          onCancel={() => setCurrentRecord(undefined)}
        />
      )}
    </Box>
  )
}

const RecordDeleter = ({
  appId,
  formId,
  recordId,
}: {
  appId: string
  formId: string
  recordId: string
}) => {
  const [deleteRecord] = useMutation<
    { deleteRecord: boolean },
    { applicationId: string; formId: string; recordId: string }
  >(
    gql`
      mutation DeleteRecord($applicationId: String!, $formId: String!, $recordId: String!) {
        deleteRecord(applicationId: $applicationId, formId: $formId, recordId: $recordId)
      }
    `,
    { refetchQueries: ['Records'] }
  )

  return (
    <span onClick={e => e.stopPropagation()}>
      <Popconfirm
        title="确定删除？"
        cancelText="取消"
        okText="删除"
        icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
        onConfirm={() =>
          deleteRecord({ variables: { applicationId: appId, formId, recordId } }).catch(error => {
            message.error(error.message)
          })
        }
      >
        <a>删除</a>
      </Popconfirm>
    </span>
  )
}

const RecordUpdater = ({
  appId,
  formId,
  viewId,
  recordId,
  onCancel,
}: {
  appId: string
  formId: string
  viewId: string
  recordId: string
  onCancel?: () => void
}) => {
  const [updateRecord, { loading }] = useMutation<
    { updateRecord: { id: string } },
    {
      applicationId: string
      formId: string
      recordId: string
      input: { data?: { [key: string]: { value: any } } }
    }
  >(
    gql`
      mutation UpdateRecord(
        $applicationId: String!
        $formId: String!
        $recordId: String!
        $input: UpdateRecordInput!
      ) {
        updateRecord(
          applicationId: $applicationId
          formId: $formId
          recordId: $recordId
          input: $input
        ) {
          id
          updatedAt
          data
        }
      }
    `,
    { refetchQueries: ['Records'] }
  )

  const { data: { application: app } = {} } = useQuery<
    {
      application: {
        id: string
        form: Pick<ApplicationForm['form'], 'id' | 'name' | 'fields' | 'layout'> & {
          record: {
            id: string
            createdAt: number
            updatedAt?: number
            data: { [key: string]: any }
          }
        }
      }
    },
    {
      applicationId: string
      formId: string
      viewId: string
      recordId: string
    }
  >(
    gql`
      query ApplicationFormWithRecord(
        $applicationId: String!
        $formId: String!
        $viewId: String!
        $recordId: String!
      ) {
        application(applicationId: $applicationId) {
          id
          form(formId: $formId) {
            id
            name
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

            record(viewId: $viewId, recordId: $recordId) {
              id
              createdAt
              updatedAt
              data
            }
          }
        }
      }
    `,
    { variables: { applicationId: appId, formId, viewId, recordId } }
  )

  const formProps = useMemo<FormRendererProps>(() => {
    return {
      fields:
        app?.form.fields?.reduce<FormRendererProps['fields']>(
          (res, field) => Object.assign(res, { [field.id]: field }),
          {}
        ) ?? {},
      layout: app?.form.layout?.rows.map(row => row.children.map(col => col.fieldId)) ?? [],
    }
  }, [app])

  // TODO: initialize field value
  const [value, setValue] = useState<Value>()

  useEffect(() => {
    if (app?.form.record) {
      setValue({ data: app.form.record.data })
    }
  }, [app?.form.record])

  const handleSubmit = () => {
    if (loading || !value) {
      return
    }
    updateRecord({
      variables: { applicationId: appId, formId, recordId, input: { data: value.data } },
    })
      .then(() => {
        message.success('保存成功')
        onCancel?.()
      })
      .catch(error => {
        message.error(error.message)
      })
  }

  return (
    <_Modal
      title={
        <Breadcrumb>
          <Breadcrumb.Item>{app?.form.name}</Breadcrumb.Item>
        </Breadcrumb>
      }
      centered
      destroyOnClose
      visible
      footer={
        <>
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            提交
          </Button>
        </>
      }
      onCancel={onCancel}
    >
      <FormRenderer {...formProps} value={value} onChange={setValue} />
    </_Modal>
  )
}
