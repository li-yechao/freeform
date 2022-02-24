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

const clientId = process.env['dingtalk.clientId']
if (!clientId) {
  throw new Error('Required env dingtalk.clientId is missing')
}

const clientSecret = process.env['dingtalk.clientSecret']
if (!clientSecret) {
  throw new Error('Required env dingtalk.clientSecret is missing')
}

/**
 * @type {import('../src/user/third-user.service').ThirdUserModule}
 */
const mod = {
  async getViewer(_, query) {
    const code = query?.['code']
    if (!code) {
      throw new Error(`Invalid dingtalk code ${code}`)
    }

    const token = await fetch('https://api.dingtalk.com/v1.0/oauth2/userAccessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId,
        clientSecret,
        code,
        grantType: 'authorization_code',
      }),
    }).then(res => res.json())

    if (!token?.accessToken) {
      throw new Error(`Failed to call dingtalk api oauth2/userAccessToken`)
    }

    const user = await fetch('https://api.dingtalk.com/v1.0/contact/users/me', {
      method: 'GET',
      headers: {
        'x-acs-dingtalk-access-token': token.accessToken,
      },
    }).then(res => res.json())

    return {
      id: `${user.unionId}@${clientId}`,
      user,
    }
  },
}

module.exports = mod
