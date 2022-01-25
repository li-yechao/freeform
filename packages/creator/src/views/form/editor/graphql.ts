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

import { gql, MutationHookOptions, QueryHookOptions, useMutation, useQuery } from '@apollo/client'

export interface Application {
  id: string
  createdAt: number
  updatedAt?: number
  name?: string

  form: Form
}

export interface Form {
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
}

export type UpdateFormInput = Partial<Pick<Form, 'name' | 'description' | 'fields' | 'layout'>>

export const useApplicationForm = (
  options?: QueryHookOptions<
    { application: Application },
    { applicationId: string; formId: string }
  >
) => {
  return useQuery(
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
}

export const useUpdateForm = (
  options?: MutationHookOptions<
    { updateForm: Form },
    { applicationId: string; formId: string; input: UpdateFormInput }
  >
) => {
  return useMutation(
    gql`
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
    `,
    { ...options }
  )
}
