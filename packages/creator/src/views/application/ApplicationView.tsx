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

import { gql, QueryHookOptions, useQuery } from '@apollo/client'
import { useParams } from 'react-router-dom'
import NetworkIndicator from '../../components/NetworkIndicator'

export default function ApplicationView() {
  const { applicationId } = useParams<{ applicationId: string }>()
  if (!applicationId) {
    throw new Error(`Required params applicationId is missing`)
  }
  const application = useApplication({ variables: { id: applicationId } })

  return (
    <>
      <NetworkIndicator in={application.loading} />
    </>
  )
}

interface Application {
  id: string
  createdAt: number
  updatedAt?: number
  name?: string
}

const useApplication = (options?: QueryHookOptions<{ application: Application }, { id: string }>) =>
  useQuery(
    gql`
      query Application($id: String!) {
        application(id: $id) {
          id
          createdAt
          updatedAt
          name
        }
      }
    `,
    options
  )
