import {
  ApolloClient,
  ApolloLink,
  FetchResult,
  gql,
  HttpLink,
  InMemoryCache,
  Observable,
  Operation,
} from '@apollo/client'
import { ErrorLink } from '@apollo/client/link/error'
import { Injectable } from '@nestjs/common'
import fetch from 'cross-fetch'
import { GraphQLError } from 'graphql'
import { Config } from '../config'

@Injectable()
export class TaskService {
  constructor(private readonly config: Config) {
    this.tasklistGraphqlClient = createClient(() => this.config.zeebe.tasklist.accessToken.sign())

    this.getTasks({}).then(console.log)
  }

  private tasklistGraphqlClient: ApolloClient<any>

  private async getTasks(variables: {
    state?: TaskState
    assigned?: boolean
    assignee?: string
    candidateGroup?: string
    pageSize?: number
    taskDefinitionId?: string
    searchAfter?: string[]
    searchAfterOrEqual?: string[]
    searchBefore?: string[]
    searchBeforeOrEqual?: string[]
  }) {
    return this.tasklistGraphqlClient
      .query<{ tasks: { id: string; name: string }[] }, typeof variables>({
        query: gql`
          query Tasks(
            $state: TaskState
            $assigned: Boolean
            $assignee: String
            $candidateGroup: String
            $pageSize: Int
            $taskDefinitionId: String
            $searchAfter: [String!]
            $searchAfterOrEqual: [String!]
            $searchBefore: [String!]
            $searchBeforeOrEqual: [String!]
          ) {
            tasks(
              query: {
                state: $state
                assigned: $assigned
                assignee: $assignee
                candidateGroup: $candidateGroup
                pageSize: $pageSize
                taskDefinitionId: $taskDefinitionId
                searchAfter: $searchAfter
                searchAfterOrEqual: $searchAfterOrEqual
                searchBefore: $searchBefore
                searchBeforeOrEqual: $searchBeforeOrEqual
              }
            ) {
              id
              name
              taskDefinitionId
              processName
              creationTime
              completionTime
              assignee
              variables {
                id
                name
                value
                previewValue
                isValueTruncated
              }
              taskState
              sortValues
              isFirst
              formKey
              processDefinitionId
              candidateGroups
            }
          }
        `,
        variables,
      })
      .then(res => res.data.tasks)
  }
}

type TaskState = 'CREATED' | 'COMPLETED' | 'CANCELED'

function createClient(getToken: () => string) {
  const Storage = { token: { accessToken: getToken() } }

  const refreshTokenLink = new RefreshAccessTokenLink({
    needRefreshToken: () => {
      return true
    },
    refreshToken: async () => {
      Storage.token = { accessToken: getToken() }
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

  const httpLink = new HttpLink({
    uri: 'http://localhost:26502/graphql',
    fetch,
  })

  const client = new ApolloClient({
    link: authLink.concat(refreshTokenLink).concat(httpLink),
    cache: new InMemoryCache({ resultCaching: false }),
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
