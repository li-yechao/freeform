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

import {
  ApolloClient,
  gql,
  InMemoryCache,
  LazyQueryHookOptions,
  QueryHookOptions,
  useLazyQuery,
  useQuery,
} from '@apollo/client'

export interface Viewer {
  nick: string
}

export const VIEWER_QUERY = gql`
  query Viewer {
    viewer {
      nick
    }
  }
`

export const useViewerQuery = (options?: QueryHookOptions<{ viewer: Viewer }>) =>
  useQuery(VIEWER_QUERY, options)

export const useViewerLazyQuery = (options?: LazyQueryHookOptions<{ viewer: Viewer }>) =>
  useLazyQuery(VIEWER_QUERY, options)

export async function queryViewerWithToken(token: string): Promise<Viewer> {
  const client = new ApolloClient({
    uri: import.meta.env.VITE_GRAPHQL_URI,
    cache: new InMemoryCache(),
    headers: {
      authorization: `Bearer ${token}`,
    },
  })
  return (await client.query<Viewer>({ query: VIEWER_QUERY })).data
}
