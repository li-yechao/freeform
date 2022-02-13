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

import { Token } from '../Storage'

export async function refreshToken(refreshToken: string): Promise<Token> {
  return fetch(`${import.meta.env.VITE_AUTH_API}/auth/refreshToken?refreshToken=${refreshToken}`, {
    method: 'POST',
  }).then(res => {
    if (res.status >= 200 && res.status < 300) {
      return res.json()
    }
    throw new Error(res.statusText)
  })
}
