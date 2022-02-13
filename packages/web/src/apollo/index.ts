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
  ApolloLink,
  createHttpLink,
  FetchResult,
  InMemoryCache,
  Observable,
  Operation,
} from '@apollo/client'
import { ErrorLink } from '@apollo/client/link/error'
import { GraphQLError } from 'graphql'
import Storage from '../Storage'
import { refreshToken } from './auth'

export function createClient() {
  const refreshTokenLink = new RefreshAccessTokenLink({
    needRefreshToken: error => {
      const refreshToken = Storage.token?.refreshToken
      if (!refreshToken) {
        return false
      }
      const exception: any = error?.[0]?.extensions['exception']
      return exception?.name === 'JsonWebTokenError' || exception?.name === 'TokenExpiredError'
    },
    refreshToken: async () => {
      const token = Storage.token?.refreshToken
      if (typeof token !== 'string') {
        throw new Error('Invalid refresh_token')
      }
      Storage.token = await refreshToken(token)
    },
    processOperation: operation => {
      const { token } = Storage
      if (!token) {
        throw new Error('Invalid token')
      }
      operation.setContext(({ headers = {} }) => ({
        headers: {
          ...headers,
          authorization: `Bearer ${token.accessToken}`,
        },
      }))
    },
  })

  const authLink = new ApolloLink((operation, forward) => {
    const { token } = Storage

    if (token?.accessToken) {
      operation.setContext(({ headers = {} }) => ({
        headers: {
          ...headers,
          authorization: `Bearer ${token.accessToken}`,
        },
      }))
    }

    return forward(operation)
  })

  const httpLink = createHttpLink({
    uri: import.meta.env.VITE_GRAPHQL_URI,
  })

  const client = new ApolloClient({
    link: authLink.concat(refreshTokenLink).concat(httpLink),
    cache: new InMemoryCache(),
  })
  return client
}

export interface RefreshAccessTokenLinkOptions {
  needRefreshToken: (error: readonly GraphQLError[] | undefined) => boolean
  refreshToken: () => Promise<void> | void
  processOperation: (operation: Operation) => void
}

class RefreshAccessTokenLink extends ErrorLink {
  private options: RefreshAccessTokenLinkOptions
  private isRefreshing = false
  private pendings: Function[] = []

  constructor(options: RefreshAccessTokenLinkOptions) {
    super(e => this.handleError(e))
    this.options = options
  }

  private handleError: ErrorLink.ErrorHandler = ({ graphQLErrors, operation, forward }) => {
    if (this.options.needRefreshToken(graphQLErrors)) {
      return new Observable<FetchResult>(observer => {
        ;(async () => {
          try {
            if (!this.isRefreshing) {
              this.isRefreshing = true
              await this.options.refreshToken()
            } else {
              const promise = new Promise(resolve => this.pendings.push(resolve))
              await promise
            }

            this.options.processOperation(operation)
            forward(operation).subscribe(observer)
          } catch (error) {
            observer.error(error)
          } finally {
            const pendings = this.pendings
            this.pendings = []
            pendings.forEach(i => i())
            this.isRefreshing = false
          }
        })()
      })
    }

    return
  }
}
