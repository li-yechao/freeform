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

import { customAlphabet } from 'nanoid'

export default function customIdGenerator(alphabet: string, size: number, startAlphabet?: string) {
  if (startAlphabet) {
    const s = customAlphabet(startAlphabet, 1)
    const o = customAlphabet(alphabet, size - 1)
    return () => s() + o()
  }
  return customAlphabet(alphabet, size)
}

export function idGeneratorUpperAndNumber(size: number) {
  return customIdGenerator(
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    size,
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  )
}
