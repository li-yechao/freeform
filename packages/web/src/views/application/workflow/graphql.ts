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
import { CreateWorkflowInput, UpdateWorkflowInput } from '../workflow-edit/graphql'

export interface Application {
  id: string
  createdAt: number
  updatedAt?: number
  name?: string

  workflows: Workflow[]
}

export interface Workflow {
  id: string
  createdAt: number
  updated?: number
  name?: string
  trigger?: any
}

export const useApplication = (
  options?: QueryHookOptions<{ application: Application }, { applicationId: string }>
) => {
  return useQuery(
    gql`
      query ApplicationWorkflows($applicationId: String!) {
        application(applicationId: $applicationId) {
          id
          createdAt
          updatedAt
          name

          workflows {
            id
            createdAt
            updatedAt
            name
            trigger
          }
        }
      }
    `,
    options
  )
}

export const useCreateWorkflow = (
  options?: MutationHookOptions<
    { createWorkflow: Workflow },
    { applicationId: string; input: CreateWorkflowInput }
  >
) => {
  return useMutation(
    gql`
      mutation CreateWorkflow($applicationId: String!, $input: CreateWorkflowInput!) {
        createWorkflow(applicationId: $applicationId, input: $input) {
          id
          createdAt
          updatedAt
          name
          trigger
        }
      }
    `,
    { refetchQueries: ['ApplicationWorkflows'], ...options }
  )
}

export const useUpdateWorkflow = (
  options?: MutationHookOptions<
    { updateWorkflow: Workflow },
    { applicationId: string; workflowId: string; input: UpdateWorkflowInput }
  >
) => {
  return useMutation(
    gql`
      mutation UpdateWorkflow(
        $applicationId: String!
        $workflowId: String!
        $input: UpdateWorkflowInput!
      ) {
        updateWorkflow(applicationId: $applicationId, workflowId: $workflowId, input: $input) {
          id
          createdAt
          updatedAt
          name
          trigger
        }
      }
    `,
    { refetchQueries: ['ApplicationWorkflows'], ...options }
  )
}

export const useDeleteWorkflow = (
  options?: MutationHookOptions<
    { deleteWorkflow: boolean },
    { applicationId: string; workflowId: string }
  >
) => {
  return useMutation(
    gql`
      mutation DeleteWorkflow($applicationId: String!, $workflowId: String!) {
        deleteWorkflow(applicationId: $applicationId, workflowId: $workflowId)
      }
    `,
    { refetchQueries: ['ApplicationWorkflows'], ...options }
  )
}
