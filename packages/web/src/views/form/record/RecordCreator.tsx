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
import { Button, message, Modal } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import FormRenderer, { FormRendererProps } from '../../../components/FormRenderer'
import { Value } from '../../../components/FormRenderer/state'
import { Application } from '../graphql'
import { useCreateRecord } from './graphql'

export default function RecordCreator({
  application,
  visible,
  onCancel,
}: {
  application: Application
  visible?: boolean
  onCancel?: () => void
}) {
  const [createRecord, { loading }] = useCreateRecord()

  const formProps = useMemo<FormRendererProps>(() => {
    return {
      fields:
        application.form.fields?.reduce<FormRendererProps['fields']>(
          (res, field) => Object.assign(res, { [field.id]: field }),
          {}
        ) ?? {},
      layout: application.form.layout?.rows.map(row => row.children.map(col => col.fieldId)) ?? [],
    }
  }, [application])

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
      variables: {
        applicationId: application.id,
        formId: application.form.id,
        input: { data: value.data },
      },
    })
      .then(() => {
        message.success('创建成功')
        onCancel?.()
      })
      .catch(error => {
        message.error(error.message)
        throw error
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
