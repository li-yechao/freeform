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

import produce from 'immer'
import { useCallback } from 'react'
import { atom, useRecoilValue, useSetRecoilState } from 'recoil'
import { idGeneratorUpperAndNumber } from '../../utils/customIdGenerator'
import { defaultProps } from './field'

const generateFieldId = idGeneratorUpperAndNumber(5)

export type FieldState = 'DISABLED' | 'READONLY'

export type Field = {
  id: string
  type: string
  label: string
  state?: FieldState
  meta?: { [key: string]: any }
}

export type Placement = 'left' | 'right' | 'top' | 'bottom'

export type Schema = {
  fields: { [key: string]: Field }
  layout: string[][]
  current?: string | undefined
}

const schemaState = atom<Schema>({
  key: 'fieldsState',
  default: { fields: {}, layout: [] },
})

export function useSchema() {
  return useRecoilValue(schemaState)
}

export function useSetSchema() {
  return useSetRecoilState(schemaState)
}

export function useCurrentField() {
  const { fields, current } = useSchema()

  return fields[current!]
}

export function useSetCurrentField() {
  const setSchema = useSetSchema()

  return useCallback((current?: string) => setSchema(v => ({ ...v, current })), [setSchema])
}

export function useDeleteField() {
  const setSchema = useSetSchema()

  return useCallback(
    (id: string) =>
      setSchema(v =>
        produce(v, draft => {
          if (id === draft.current) {
            draft.current = undefined
          }

          delete draft.fields[id]

          for (let rowIndex = 0; rowIndex < draft.layout.length; rowIndex++) {
            const row = draft.layout[rowIndex]!
            const index = row.findIndex(i => i === id)
            if (index >= 0) {
              row.splice(index, 1)
              if (row.length === 0) {
                draft.layout.splice(rowIndex, 1)
              }
              break
            }
          }
        })
      ),
    [setSchema]
  )
}

export function useDeleteCurrentField() {
  const setSchema = useSetSchema()

  return useCallback(
    () =>
      setSchema(v => {
        return produce(v, draft => {
          const current = draft.current
          if (!current) {
            return
          }

          draft.current = undefined
          delete draft.fields[current]

          for (let rowIndex = 0; rowIndex < draft.layout.length; rowIndex++) {
            const row = draft.layout[rowIndex]!
            const index = row.findIndex(i => i === current)
            if (index >= 0) {
              row.splice(index, 1)
              if (row.length === 0) {
                draft.layout.splice(rowIndex, 1)
              }
              break
            }
          }
        })
      }),
    [setSchema]
  )
}

export function useAddOrMoveField() {
  const setSchema = useSetSchema()

  return useCallback(
    ({
      id,
      targetId,
      placement,
      type,
    }: {
      id?: string
      targetId?: string
      placement?: Placement
      type: string
    }) => {
      if (id && id === targetId) {
        return
      }

      setSchema(
        produce(draft => {
          if (id) {
            for (let rowIndex = 0; rowIndex < draft.layout.length; rowIndex++) {
              const row = draft.layout[rowIndex]!
              const index = row.findIndex(i => i === id)
              if (index >= 0) {
                row.splice(index, 1)[0]
                if (row.length === 0) {
                  draft.layout.splice(rowIndex, 1)
                }
                break
              }
            }
          } else {
            id = generateFieldId()
            draft.fields[id] = { id, type, ...defaultProps(type) }
          }

          if (targetId && placement) {
            for (let rowIndex = 0; rowIndex < draft.layout.length; rowIndex++) {
              const row = draft.layout[rowIndex]!

              const colIndex = row.findIndex(i => i === targetId)
              if (colIndex >= 0) {
                switch (placement) {
                  case 'left':
                    row.splice(colIndex, 0, id)
                    break
                  case 'right':
                    row.splice(colIndex + 1, 0, id)
                    break
                  case 'top':
                    draft.layout.splice(rowIndex, 0, [id])
                    break
                  case 'bottom':
                    draft.layout.splice(rowIndex + 1, 0, [id])
                    break
                }
                break
              }
            }
          } else {
            draft.layout.push([id])
          }

          draft.current = id
        })
      )
    },
    [setSchema]
  )
}

export function useSetField() {
  const setSchema = useSetSchema()

  return useCallback(
    (id: string, field: Partial<Omit<Field, 'id'>>) =>
      setSchema(v =>
        produce(v, draft => {
          Object.assign(draft.fields[id], field)
        })
      ),
    [setSchema]
  )
}
