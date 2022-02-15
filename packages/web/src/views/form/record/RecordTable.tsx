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

import { QuestionCircleOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { Box } from '@mui/system'
import {
  Breadcrumb,
  Button,
  message,
  Modal,
  Popconfirm,
  Space,
  Table,
  TableColumnsType,
} from 'antd'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CellRenderer } from '../../../components/FormCreator/field'
import FormRenderer, { FormRendererProps } from '../../../components/FormRenderer'
import { Value } from '../../../components/FormRenderer/state'
import { notEmpty } from '../../../utils/array'
import { useApplicationFormViews } from '../graphql'
import { useApplicationRecord, useDeleteRecord, useRecords, useUpdateRecord } from './graphql'

export default function RecordTable() {
  const { applicationId, formId, viewId } = useParams<'applicationId' | 'formId' | 'viewId'>()
  if (!applicationId || !formId || !viewId) {
    throw new Error(`Required parameter applicationId or formId or viewId is missing`)
  }

  const { data: { application } = {} } = useApplicationFormViews({
    variables: { applicationId, formId },
  })

  const view = useMemo(
    () => application?.form.views?.find(i => i.id === viewId),
    [application, viewId]
  )

  const columns = useMemo(() => {
    const columns: TableColumnsType<{ id: string }> | undefined = view?.fields
      ?.map(({ fieldId }) => application?.form.fields?.find(f => f.id === fieldId))
      .filter(notEmpty)
      .map(field => ({
        title: field.label,
        dataIndex: ['data', field.id, 'value'],
        ellipsis: true,
        render: value => (
          <CellRenderer applicationId={applicationId} formId={formId} {...field} value={value} />
        ),
      }))

    columns?.push({
      title: '操作',
      width: 80,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <RecordDeleter applicationId={applicationId} formId={formId} recordId={record.id} />
        </Space>
      ),
    })

    return columns ?? []
  }, [view])

  const [{ page, limit }, setPage] = useState({ page: 0, limit: 20 })

  const { data } = useRecords({
    variables: { applicationId, formId, viewId, page, limit },
    fetchPolicy: 'cache-and-network',
  })
  const records = data?.application.form.records

  const [currentRecord, setCurrentRecord] = useState<{ id: string }>()

  const containerRef = useRef<HTMLDivElement>(null)

  const [height, setHeight] = useState(0)

  const refreshHeight = useCallback(() => {
    const e = containerRef.current!
    const header =
      e.getElementsByClassName('ant-table-header').item(0)?.getBoundingClientRect().height ?? 0
    const pagination =
      e.getElementsByClassName('ant-pagination').item(0)?.getBoundingClientRect().height ?? 0
    setHeight(e.clientHeight - header - pagination)
  }, [])

  useEffect(() => {
    refreshHeight()
  }, [records])

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      for (const e of entries) {
        if (e.target === containerRef.current) {
          refreshHeight()
        }
      }
    })
    observer.observe(containerRef.current!)
    return () => observer.disconnect()
  }, [])

  return (
    <Box ref={containerRef} sx={{ flex: 1, overflow: 'auto' }}>
      <_Table
        bordered
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={records?.nodes ?? []}
        onRow={record => ({
          onClick: () => setCurrentRecord(record),
        })}
        pagination={{
          current: page + 1,
          pageSize: limit,
          total: records?.pageInfo.count,
          showSizeChanger: false,
          showTotal: total => <span>共{total}条</span>,
          onChange: (page, limit) => setPage({ page: page - 1, limit }),
        }}
        scroll={{ y: height }}
      />

      {currentRecord && (
        <RecordUpdater
          applicationId={applicationId}
          formId={formId}
          viewId={viewId}
          recordId={currentRecord.id}
          onCancel={() => setCurrentRecord(undefined)}
        />
      )}
    </Box>
  )
}

const RecordDeleter = ({
  applicationId,
  formId,
  recordId,
}: {
  applicationId: string
  formId: string
  recordId: string
}) => {
  const [deleteRecord] = useDeleteRecord()

  return (
    <span onClick={e => e.stopPropagation()}>
      <Popconfirm
        title="确定删除？"
        okText="删除"
        icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
        onConfirm={() =>
          deleteRecord({ variables: { applicationId, formId, recordId } }).catch(error => {
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

const RecordUpdater = ({
  applicationId,
  formId,
  viewId,
  recordId,
  onCancel,
}: {
  applicationId: string
  formId: string
  viewId: string
  recordId: string
  onCancel?: () => void
}) => {
  const [updateRecord, { loading }] = useUpdateRecord()

  const { data: { application } = {} } = useApplicationRecord({
    variables: { applicationId, formId, viewId, recordId },
  })

  const formProps = useMemo<FormRendererProps>(() => {
    return {
      applicationId,
      formId,
      fields:
        application?.form.fields?.reduce<FormRendererProps['fields']>(
          (res, field) => Object.assign(res, { [field.id]: field }),
          {}
        ) ?? {},
      layout: application?.form.layout?.rows.map(row => row.children.map(col => col.fieldId)) ?? [],
    }
  }, [application])

  // TODO: initialize field value
  const [value, setValue] = useState<Value>()

  useEffect(() => {
    if (application?.form.record) {
      setValue({ data: application.form.record.data ?? {} })
    }
  }, [application?.form.record])

  const handleSubmit = () => {
    if (loading || !value) {
      return
    }
    updateRecord({
      variables: { applicationId: applicationId, formId, recordId, input: { data: value.data } },
    })
      .then(() => {
        message.success('保存成功')
        onCancel?.()
      })
      .catch(error => {
        message.error(error.message)
        throw error
      })
  }

  return (
    <_Modal
      title={
        <Breadcrumb>
          <Breadcrumb.Item>{application?.form.name}</Breadcrumb.Item>
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

const _Table: typeof Table = styled(Table)`
  .ant-table-bordered {
    > .ant-table-container {
      border-left: 0;

      > .ant-table-content > table,
      > .ant-table-header > table {
        border-top: 0;
      }
    }
  }

  .ant-table-small .ant-table-tbody > tr > td {
    padding: 6px;
    line-height: 20px;
  }

  .ant-pagination {
    border-top: 1px solid #efefef;
    margin: 0;
    padding: 16px;
  }
` as any
