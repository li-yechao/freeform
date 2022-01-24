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

import { gql, QueryHookOptions, useMutation, useQuery } from '@apollo/client'
import { Box } from '@mui/system'
import { Button, message } from 'antd'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import FormCreator, { FieldState, Schema } from '../../components/FormCreator'
import NetworkIndicator from '../../components/NetworkIndicator'
import { HeaderAction, useHeaderActionsCtrl } from '../../state/header'

export default function FormEditView() {
  const { applicationId, formId } = useParams<{ applicationId: string; formId: string }>()
  if (!applicationId || !formId) {
    throw new Error(`Required params applicationId or formId is missing`)
  }

  const appForm = useApplicationForm({ variables: { applicationId, formId } })

  const [schema, setSchema] = useState<Schema>()

  useEffect(() => {
    const form = appForm.data?.application.form

    type Fields = NonNullable<typeof schema>['fields']

    setSchema({
      fields:
        form?.fields?.reduce<Fields>(
          (res, field) => Object.assign(res, { [field.id]: field }),
          {}
        ) ?? {},
      layout: form?.layout?.rows.map(row => row.children.map(col => col.fieldId)) ?? [],
    })
  }, [appForm.data])

  const headerActionsCtrl = useHeaderActionsCtrl()

  useEffect(() => {
    const exportButton: HeaderAction<React.ComponentProps<typeof SaveButton>> = {
      key: 'ObjectView-MenuButton',
      component: SaveButton,
      props: { applicationId, formId, schema },
    }
    headerActionsCtrl.set(exportButton)

    return () => headerActionsCtrl.remove(exportButton)
  }, [applicationId, formId, schema])

  return (
    <>
      <NetworkIndicator in={appForm.loading} />

      <Box sx={{ position: 'absolute', left: 0, top: 40, right: 0, bottom: 0 }}>
        <FormCreator value={schema} onChange={setSchema} />
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
      state?: FieldState
      meta?: { [key: string]: any }
    }[]

    layout?: {
      rows: {
        children: {
          fieldId: string
        }[]
      }[]
    }
  }
}

const useApplicationForm = (
  options?: QueryHookOptions<
    { application: ApplicationForm },
    { applicationId: string; formId: string }
  >
) =>
  useQuery(
    gql`
      query ApplicationForm($applicationId: String!, $formId: String!) {
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
          }
        }
      }
    `,
    options
  )

const SaveButton = ({
  applicationId,
  formId,
  schema,
}: {
  applicationId: string
  formId: string
  schema?: Schema
}) => {
  const [updateForm, { loading, error, data }] = useMutation<
    { updateForm: { id: string } },
    {
      applicationId: string
      formId: string
      input: Partial<Pick<ApplicationForm['form'], 'name' | 'description' | 'fields' | 'layout'>>
    }
  >(gql`
    mutation UpdateForm($applicationId: String!, $formId: String!, $input: UpdateFormInput!) {
      updateForm(applicationId: $applicationId, formId: $formId, input: $input) {
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
      }
    }
  `)

  useEffect(() => {
    if (error) {
      message.error(error.message)
    } else if (data?.updateForm) {
      message.success('保存成功')
    }
  }, [error, data])

  return (
    <Button
      loading={loading}
      onClick={() => {
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
      }}
    >
      保存
    </Button>
  )
}
