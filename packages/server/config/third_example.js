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

/**
 * @type {import('../src/user/third-user.service').ThirdUserModule}
 */
const mod = {
  async getViewer(ctx, query) {
    const accessToken = query?.['accessToken']
    if (!accessToken) {
      throw new Error(`Invalid example accessToken ${accessToken}`)
    }

    const user = await fetch('https://api.example.com/viewer', {
      headers: { authorization: `Bearer ${accessToken}` },
    })
      .then(res => res.json())
      .then(res => {
        if (!res?.userId) {
          throw new Error(`Invalid example user response ${res}`)
        }
        return {
          id: res.userId,
          user: res,
        }
      })

    ctx.set('accessToken', accessToken)

    return user
  },

  getDepartments() {
    throw new Error('Unimplements')
  },

  getDepartment() {
    throw new Error('Unimplements')
  },

  getDepartmentUsers() {
    throw new Error('Unimplements')
  },
}

module.exports = mod
