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
import { Application } from '../graphql'

export interface Record {
  id: string
  createdAt: number
  updatedAt?: number
  data?: { [key: string]: { value: any } }
}

export interface CreateRecordInput {
  data: { [key: string]: { value: any } }
}

export type UpdateRecordInput = CreateRecordInput

export const useApplicationRecord = (
  options?: QueryHookOptions<
    {
      application: {
        id: string
        form: Pick<Application['form'], 'id' | 'name' | 'fields' | 'layout'> & {
          record: Record
        }
      }
    },
    { applicationId: string; formId: string; viewId: string; recordId: string }
  >
) => {
  return useQuery(
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
    options
  )
}

export const useRecords = (
  options?: QueryHookOptions<
    {
      application: {
        id: string

        form: {
          id: string

          records: {
            nodes: Record[]
            totalCount: number
          }
        }
      }
    },
    { applicationId: string; formId: string; viewId: string; offset: number; first: number }
  >
) => {
  return useQuery(
    gql`
      query Records(
        $applicationId: String!
        $formId: String!
        $viewId: String!
        $offset: Int
        $first: Int
      ) {
        application(applicationId: $applicationId) {
          id

          form(formId: $formId) {
            id

            records(viewId: $viewId, offset: $offset, first: $first) {
              nodes {
                id
                createdAt
                updatedAt
                data
              }

              totalCount
            }
          }
        }
      }
    `,
    options
  )
}

export const useCreateRecord = () => {
  return useMutation<
    { createRecord: Record },
    { applicationId: string; formId: string; input: CreateRecordInput }
  >(
    gql`
      mutation CreateRecord($applicationId: String!, $formId: String!, $input: CreateRecordInput!) {
        createRecord(applicationId: $applicationId, formId: $formId, input: $input) {
          id
          createdAt
          updatedAt
          data
        }
      }
    `,
    { refetchQueries: ['Records'] }
  )
}

export const useUpdateRecord = () => {
  return useMutation<
    { updateRecord: Record },
    { applicationId: string; formId: string; recordId: string; input: UpdateRecordInput }
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
          createdAt
          updatedAt
          data
        }
      }
    `,
    { refetchQueries: ['Records'] }
  )
}

export const useDeleteRecord = () => {
  return useMutation<
    { deleteRecord: { id: string } },
    { applicationId: string; formId: string; recordId: string }
  >(
    gql`
      mutation DeleteRecord($applicationId: String!, $formId: String!, $recordId: String!) {
        deleteRecord(applicationId: $applicationId, formId: $formId, recordId: $recordId) {
          id
        }
      }
    `,
    { refetchQueries: ['Records'] }
  )
}
