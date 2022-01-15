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

import styled from '@emotion/styled'
import { DeleteForever, DragIndicator } from '@mui/icons-material'
import {
  Box,
  Button,
  Checkbox as _Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  IconButton,
  Input,
} from '@mui/material'
import produce from 'immer'
import { customAlphabet } from 'nanoid'
import { useRef } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import { Field } from '../state'

export const nextOptionId = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 5)

export interface CheckboxProps extends Field {
  meta?: {
    options?: CheckboxOption[]
  }
}

export interface CheckboxOption {
  id: string
  label: string
  value: any
}

export const initialCheckboxProps: Omit<CheckboxProps, 'id' | 'type'> = {
  label: '多选',
  meta: {
    options: [
      { id: nextOptionId(), label: '选项1', value: '选项1' },
      { id: nextOptionId(), label: '选项2', value: '选项2' },
    ],
  },
}

export default function Checkbox(props: CheckboxProps & { tabIndex?: number }) {
  return (
    <FormGroup row>
      {props.meta?.options?.map(option => (
        <FormControlLabel
          key={option.id}
          control={
            <_Checkbox
              disabled={props.state === 'DISABLED'}
              readOnly={props.state === 'READONLY'}
              tabIndex={props.tabIndex}
            />
          }
          value={option.value}
          label={option.label}
        />
      ))}
    </FormGroup>
  )
}

export function CheckboxConfigure({
  field,
  setField,
}: {
  field: CheckboxProps
  setField: (field: Partial<CheckboxProps>) => void
}) {
  return (
    <>
      <OptionsConfigure field={field} setField={setField} />
    </>
  )
}

export function OptionsConfigure({
  field,
  setField,
}: {
  field: CheckboxProps
  setField: (field: Partial<CheckboxProps>) => void
}) {
  const options = field.meta?.options || []

  const addOption = () => {
    const nextLabel = getNextOptionLabel(field.meta?.options ?? [])
    setField({
      meta: { options: [...options, { id: nextOptionId(), label: nextLabel, value: nextLabel }] },
    })
  }

  const deleteOption = (option: CheckboxOption) => {
    setField({ meta: { options: options.filter(i => i.id !== option.id) } })
  }

  const setOptionLabel = (option: CheckboxOption, label: string) => {
    setField({
      meta: {
        options: produce(options, draft => {
          const o = draft.find(i => i.id === option.id)
          if (o) {
            if (o.label === o.value) {
              o.value = label
            }
            o.label = label
          }
        }),
      },
    })
  }

  const moveOption = (src: string, dst: string) => {
    setField({
      meta: {
        options: produce(options, draft => {
          const srcIndex = options.findIndex(i => i.id === src)
          const dstIndex = options.findIndex(i => i.id === dst)
          if (srcIndex >= 0 && dstIndex >= 0) {
            const src = draft[srcIndex]!
            const dst = draft[dstIndex]!
            draft[srcIndex] = dst
            draft[dstIndex] = src
          }
        }),
      },
    })
  }

  return (
    <>
      <FormControl size="small" fullWidth margin="dense">
        <FormLabel>选项</FormLabel>
      </FormControl>
      <div>
        {options.map((option, index) => (
          <OptionConfigure
            key={index}
            {...option}
            onLabelChange={label => setOptionLabel(option, label)}
            disableDelete={options.length < 2}
            onDelete={() => deleteOption(option)}
            moveOption={moveOption}
          />
        ))}
        <Box textAlign="center">
          <Button size="small" onClick={addOption}>
            添加选项
          </Button>
        </Box>
      </div>
    </>
  )
}

const OptionConfigure = (
  props: CheckboxOption & {
    onLabelChange: (label: string) => void
    disableDelete?: boolean
    onDelete: () => void
    moveOption: (src: string, dst: string) => void
  }
) => {
  const ref = useRef<HTMLDivElement>(null)

  const [_dropCollected, drop] = useDrop<{ id: string }, unknown, unknown>({
    accept: 'checkbox-option',
    hover(item) {
      if (item.id === props.id) {
        return
      }

      props.moveOption(item.id, props.id)
    },
  })

  const [, drag, preview] = useDrag({
    type: 'checkbox-option',
    item: () => ({ id: props.id }),
  })

  drop(preview(ref))

  return (
    <_OptionConfigure ref={ref}>
      <Box ref={drag} sx={{ cursor: 'grab' }}>
        <DragIndicator />
      </Box>

      <_OptionLabelInput
        disableUnderline
        fullWidth
        value={props.label}
        onChange={e => props.onLabelChange(e.target.value)}
      />

      <IconButton size="small" disabled={props.disableDelete} onClick={props.onDelete}>
        <DeleteForever />
      </IconButton>
    </_OptionConfigure>
  )
}

const _OptionConfigure = styled.div`
  display: flex;
  align-items: center;
  margin: ${props => props.theme.spacing(0.5, 0)};
`

const _OptionLabelInput = styled(Input)`
  border: 1px solid ${props => props.theme.palette.divider};
  border-radius: ${props => props.theme.shape.borderRadius}px;

  input {
    padding: ${props => props.theme.spacing(0.5, 1)};
    line-height: 24px;
  }
`

function getNextOptionLabel(options: CheckboxOption[]): string {
  const max =
    Math.max(...options.flatMap(i => [parseEndNumber(i.label), parseEndNumber(i.value)])) || 0
  return `选项${max + 1}`
}

function parseEndNumber(s: string): number {
  const n = s.match(/(?<n>\d+)$/)?.groups?.['n']
  return (n && parseInt(n)) || 0
}