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

import { Box } from '@mui/system'
import { Button, message } from 'antd'
import equal from 'fast-deep-equal'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import FormCreator, { Schema } from '../../../components/FormCreator'
import { HeaderAction, useHeaderActionsCtrl } from '../../../state/header'
import useOnSave from '../../../utils/useOnSave'
import { useApplicationForm, useUpdateForm } from './graphql'

export default function FormEditorView() {
  const { applicationId, formId } = useParams<{ applicationId: string; formId: string }>()
  if (!applicationId || !formId) {
    throw new Error(`Required params applicationId or formId is missing`)
  }

  const { data: { application } = {} } = useApplicationForm({
    variables: { applicationId, formId },
  })

  const schemaRef = useRef<Schema>()
  const [schema, setSchema] = useState<Schema>()

  useEffect(() => {
    const form = application?.form

    type Fields = NonNullable<typeof schema>['fields']

    schemaRef.current = {
      fields:
        form?.fields?.reduce<Fields>(
          (res, field) => Object.assign(res, { [field.id]: field }),
          {}
        ) ?? {},
      layout: form?.layout?.rows.map(row => row.children.map(col => col.fieldId)) ?? [],
    }
    setSchema(schemaRef.current)
  }, [application])

  const headerActionsCtrl = useHeaderActionsCtrl()

  useEffect(() => {
    const exportButton: HeaderAction<React.ComponentProps<typeof SaveButton>> = {
      key: 'FormEditorView-SaveButton',
      component: SaveButton,
      props: {
        applicationId,
        formId,
        schema,
        disabled:
          equal(schemaRef.current?.fields, schema?.fields) &&
          equal(schemaRef.current?.layout, schema?.layout),
      },
    }
    headerActionsCtrl.set(exportButton)

    return () => headerActionsCtrl.remove(exportButton)
  }, [applicationId, formId, schema])

  return (
    <>
      <Box sx={{ position: 'absolute', left: 0, top: 40, right: 0, bottom: 0 }}>
        <FormCreator
          applicationId={applicationId}
          formId={formId}
          value={schema}
          onChange={setSchema}
        />
      </Box>
    </>
  )
}

const SaveButton = ({
  applicationId,
  formId,
  schema,
  disabled,
}: {
  applicationId: string
  formId: string
  schema?: Schema
  disabled?: boolean
}) => {
  const [updateForm, { loading, error, data }] = useUpdateForm()

  const handleUpdate = () => {
    if (!schema) {
      return
    }

    updateForm({
      variables: {
        applicationId,
        formId,
        input: {
          fields: Object.values(schema.fields).map(field => ({
            id: field.id,
            type: field.type,
            label: field.label,
            state: field.state,
            meta: field.meta,
          })),
          layout: {
            rows: schema.layout.map(row => ({
              children: row.map(fieldId => ({
                fieldId,
              })),
            })),
          },
        },
      },
    })
  }

  useEffect(() => {
    if (error) {
      message.error(error.message)
    } else if (data?.updateForm) {
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
