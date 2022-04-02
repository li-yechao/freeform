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
}

export interface CreateApplicationInput {
  name?: string
}

export type UpdateApplicationInput = Partial<CreateApplicationInput>

export const useApplications = (
  options?: QueryHookOptions<
    { applications: { nodes: Application[] } },
    { before?: string; after?: string; first?: number; last?: number }
  >
) => {
  return useQuery(
    gql`
      query Applications($before: String, $after: String, $first: Int, $last: Int) {
        applications(before: $before, after: $after, first: $first, last: $last) {
          nodes {
            id
            createdAt
            updatedAt
            name
          }
        }
      }
    `,
    options
  )
}

export const useCreateApplication = (
  options?: MutationHookOptions<
    { createApplication: Application },
    { input: CreateApplicationInput }
  >
) => {
  return useMutation(
    gql`
      mutation CreateApplication($input: CreateApplicationInput!) {
        createApplication(input: $input) {
          id
          createdAt
          updatedAt
          name
        }
      }
    `,
    { refetchQueries: ['Applications'], ...options }
  )
}

export const useUpdateApplication = (
  options?: MutationHookOptions<
    { updateApplication: Application },
    { applicationId: string; input: UpdateApplicationInput }
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
        }
      }
    `,
    options
  )
}

export const useDeleteApplication = (
  options?: MutationHookOptions<{ deleteApplication: boolean }, { applicationId: string }>
) => {
  return useMutation(
    gql`
      mutation DeleteApplication($applicationId: String!) {
        deleteApplication(applicationId: $applicationId)
      }
    `,
    { refetchQueries: ['Applications'], ...options }
  )
}
