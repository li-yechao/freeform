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

  forms: { nodes: Form[] }
}

export interface Form {
  id: string
  createdAt: number
  updated?: number
  name?: string
  description?: string
}

export interface CreateFormInput {
  name?: string
  description?: string
}

export type UpdateFormInput = Partial<CreateFormInput>

export const useApplication = (
  options?: QueryHookOptions<{ application: Application }, { applicationId: string }>
) => {
  return useQuery(
    gql`
      query ApplicationForms($applicationId: String!) {
        application(applicationId: $applicationId) {
          id
          createdAt
          updatedAt
          name

          forms(first: 100, orderBy: { field: CREATED_AT, direction: ASC }) {
            nodes {
              id
              createdAt
              updatedAt
              name
              description
            }
          }
        }
      }
    `,
    options
  )
}

export const useApplicationScript = (
  options?: QueryHookOptions<
    { application: { id: string; script?: string } },
    { applicationId: string }
  >
) => {
  return useQuery(
    gql`
      query ApplicationForms($applicationId: String!) {
        application(applicationId: $applicationId) {
          id
          script
        }
      }
    `,
    options
  )
}

export const useUpdateApplicationScript = (
  options?: MutationHookOptions<
    { updateApplication: Application },
    { applicationId: string; input: { script: string } }
  >
) => {
  return useMutation(
    gql`
      mutation UpdateApplication($applicationId: String!, $input: UpdateApplicationInput!) {
        updateApplication(applicationId: $applicationId, input: $input) {
          id
          createdAt
          updatedAt
          name
          script
        }
      }
    `,
    options
  )
}

export const useCreateForm = (
  options?: MutationHookOptions<
    { createForm: Form },
    { applicationId: string; input: CreateFormInput }
  >
) => {
  return useMutation(
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
    { refetchQueries: ['ApplicationForms'], ...options }
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
        }
      }
    `,
    { refetchQueries: ['ApplicationForms'], ...options }
  )
}

export const useDeleteForm = (
  options?: MutationHookOptions<
    { deleteForm: { id: string } },
    { applicationId: string; formId: string }
  >
) => {
  return useMutation(
    gql`
      mutation DeleteForm($applicationId: String!, $formId: String!) {
        deleteForm(applicationId: $applicationId, formId: $formId) {
          id
        }
      }
    `,
    { refetchQueries: ['ApplicationForms'], ...options }
  )
}
