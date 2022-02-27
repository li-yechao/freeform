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
import { ApprovalNode, FormTrigger, ScriptJsNode } from './editor/state'

export interface Application {
  id: string
  createdAt: number
  updatedAt?: number
  name?: string

  workflow: Workflow
}

export interface Workflow {
  id: string
  createdAt: number
  updated?: number
  name?: string
  trigger: Trigger
  children: Node[]
}

export type Trigger = FormTrigger

export type Node = ScriptJsNode | ApprovalNode

export interface CreateWorkflowInput {
  name?: string
  trigger: Trigger
  children: Node[]
}

export type UpdateWorkflowInput = Partial<CreateWorkflowInput>

export const useApplication = (
  options?: QueryHookOptions<
    { application: Application },
    { applicationId: string; workflowId: string }
  >
) => {
  return useQuery(
    gql`
      query ApplicationWorkflow($applicationId: String!, $workflowId: String!) {
        application(applicationId: $applicationId) {
          id
          createdAt
          updatedAt
          name

          workflow(workflowId: $workflowId) {
            id
            createdAt
            updatedAt
            name
            trigger
            children
          }
        }
      }
    `,
    options
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
          children
        }
      }
    `,
    { ...options }
  )
}
