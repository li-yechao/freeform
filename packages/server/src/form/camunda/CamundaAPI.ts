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

import fetch from 'cross-fetch'
import * as FormData from 'form-data'

export default class CamundaAPI {
  constructor(private readonly options: { baseUrl: string }) {}

  async deploymentCreate({
    deploymentName,
    deployChangedOnly = true,
    xml,
  }: {
    deploymentName: string
    deployChangedOnly?: boolean
    xml: string
  }): Promise<{
    id: string
    name: string
    source: string | null
    tenantId: string | null
    deploymentTime: string
  }> {
    const body = new FormData()
    body.append('deployment-name', deploymentName)
    body.append('deploy-changed-only', deployChangedOnly.toString())
    body.append('data', xml, { filename: `${deploymentName}.bpmn` })

    return this.request({
      path: '/deployment/create',
      method: 'POST',
      body,
    })
  }

  async processDefinitionStart({
    key,
    variables,
  }: {
    key: string
    variables: { [key: string]: { value: string | boolean } }
  }) {
    return this.request({
      path: `/process-definition/key/${key}/start`,
      method: 'POST',
      body: { variables },
    })
  }

  private async request({
    path,
    method,
    body,
  }: {
    path: string
    method: 'GET' | 'POST'
    body?: BodyInit | FormData | {}
  }) {
    const headers: HeadersInit = {}

    if (body) {
      if (!(body instanceof FormData) && typeof body !== 'string') {
        body = JSON.stringify(body)
        headers['Content-Type'] = 'application/json'
      }
    }
    const res = await fetch(`${this.options.baseUrl}${path}`, {
      method,
      headers,
      body: body as any,
    })
    if (!(res.status >= 200 && res.status < 300)) {
      throw new Error(`${res.statusText} ${await res.text()}`)
    }
    return await res.json()
  }
}
