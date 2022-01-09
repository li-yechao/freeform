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

import { ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import Storage from '../Storage'

export function createClient() {
  const httpLink = createHttpLink({
    uri: import.meta.env.VITE_GRAPHQL_URI,
  })

  const authLink = setContext((_, { headers }) => {
    const token = Storage.token?.accessToken

    if (!token) {
      return { headers }
    }

    return {
      headers: {
        ...headers,
        authorization: `Bearer ${token}`,
      },
    }
  })

  const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
  })
  return client
}
