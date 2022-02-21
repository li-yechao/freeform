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

const getCurrentUserUri = process.env['example.getCurrentUserUri']

if (!getCurrentUserUri) {
  throw new Error('Required env example.getCurrentUserUri is missing')
}

/**
 * Get third user
 * @param {{accessToken?: string} | undefined} query
 */
module.exports.getThirdUser = async function ({ accessToken } = {}) {
  if (!accessToken) {
    throw new Error(`Invalid example accessToken ${accessToken}`)
  }

  return fetch(getCurrentUserUri, {
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
}
