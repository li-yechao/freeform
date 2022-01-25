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

  views?: View[]
}

export interface View {
  id: string
  name?: string
  fields?: { fieldId: string }[]
}

export interface CreateViewInput {
  name?: string
  fields?: { fieldId: string }[]
}

export type UpdateViewInput = Partial<CreateViewInput>

export const useApplicationFormViews = (
  options?: QueryHookOptions<
    { application: Application },
    { applicationId: string; formId: string }
  >
) => {
  return useQuery(
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
    { ...options }
  )
}

export const useCreateView = (
  options?: MutationHookOptions<
    { createView: View },
    {
      applicationId: string
      formId: string
      input: CreateViewInput
    }
  >
) => {
  return useMutation(
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
    { refetchQueries: ['ApplicationFormViews'], ...options }
  )
}

export const useUpdateView = (
  options?: MutationHookOptions<
    { updateView: View },
    {
      applicationId: string
      formId: string
      viewId: string
      input: UpdateViewInput
    }
  >
) => {
  return useMutation(
    gql`
      mutation UpdateView(
        $applicationId: String!
        $formId: String!
        $viewId: String!
        $input: ViewInput!
      ) {
        updateView(applicationId: $applicationId, formId: $formId, viewId: $viewId, input: $input) {
          id
          name
          fields {
            fieldId
          }
        }
      }
    `,
    { ...options }
  )
}

export const useDeleteView = (
  options?: MutationHookOptions<
    { deleteView: boolean },
    { applicationId: string; formId: string; viewId: string }
  >
) => {
  return useMutation(
    gql`
      mutation DeleteView($applicationId: String!, $formId: String!, $viewId: String!) {
        deleteView(applicationId: $applicationId, formId: $formId, viewId: $viewId)
      }
    `,
    { refetchQueries: ['ApplicationFormViews'], ...options }
  )
}
