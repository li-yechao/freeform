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
import { DeleteForever } from '@mui/icons-material'
import { Box, Grid, IconButton, Typography } from '@mui/material'
import { memo, useEffect, useRef } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import { cx } from '../../utils/cx'
import FieldRenderer from './field'
import {
  Field,
  Placement,
  useAddOrMoveField,
  useDeleteCurrentField,
  useDeleteField,
  useSchema,
  useSetCurrentField,
} from './state'

export default function Form() {
  const form = useRef<HTMLDivElement>(null)

  const { layout, fields, current: currentFieldId } = useSchema()
  const addOrMoveField = useAddOrMoveField()
  const deleteCurrentField = useDeleteCurrentField()

  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Backspace') {
        deleteCurrentField()
      }
    }
    form.current?.addEventListener('keyup', handleKeyUp)
    return () => form.current?.removeEventListener('keyup', handleKeyUp)
  }, [deleteCurrentField])

  useEffect(() => {
    if (currentFieldId) {
      document.getElementById(`field-${currentFieldId}`)?.focus()
    }
  }, [currentFieldId])

  const [isOver, drop] = useDrop<{ type: string; id?: string }, void, boolean>(
    {
      accept: 'field',
      collect: monitor => {
        return monitor.isOver({ shallow: true })
      },
      drop: (item, monitor) => {
        const result = monitor.getDropResult<{
          targetId: string
          placement: Placement
          type: string
          id?: string
        }>()
        addOrMoveField({ ...item, ...result })
      },
    },
    []
  )

  drop(form)

  return (
    <_Form ref={form} className={cx(isOver && 'hover')}>
      {layout.map((row, index) => (
        <Grid container key={index}>
          {row.map(id => (
            <Grid xs={Math.max(3, 12 / row.length)} item key={id}>
              <FormField {...fields[id]!} selected={currentFieldId === id} />
            </Grid>
          ))}
        </Grid>
      ))}
    </_Form>
  )
}

const FormField = memo(({ selected, ...field }: Field & { selected?: boolean }) => {
  const setCurrentField = useSetCurrentField()
  const deleteField = useDeleteField()

  const [isDragging, drag] = useDrag(
    () => ({
      type: 'field',
      item: { id: field.id, type: field.type },
      options: { dropEffect: 'move' },
      collect: monitor => monitor.isDragging(),
    }),
    [field.id, field.type]
  )

  return (
    <_FormField
      ref={drag}
      className={cx(selected && 'selected')}
      id={`field-${field.id}`}
      sx={{ opacity: isDragging ? 0 : 1 }}
      tabIndex={0}
      onFocus={() => setCurrentField(field.id)}
    >
      <_DropTargets>
        <DropTarget id={field.id} placement="left" />
        <div>
          <DropTarget id={field.id} placement="top" />
          <DropTarget id={field.id} placement="bottom" />
        </div>
        <DropTarget id={field.id} placement="right" />
      </_DropTargets>

      <_Label variant="body2">{field.label}</_Label>

      <FieldRenderer {...field} tabIndex={-1} />

      {selected && (
        <_FormFieldFloatActions>
          <IconButton size="small" disableRipple onClick={() => deleteField(field.id)}>
            <DeleteForever color="primary" />
          </IconButton>
        </_FormFieldFloatActions>
      )}
    </_FormField>
  )
})

const _Form = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  padding: 16px;

  &.hover {
    &:after {
      content: '';
      display: block;
      height: 8px;
      margin-top: -4px;
      background-color: #1976d2;
      opacity: 0.5;
    }
  }
`

const _FormField = styled(Box)`
  position: relative;
  margin: 4px;
  padding: 4px;
  border-radius: 4px;
  min-height: 50px;
  cursor: pointer;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  &:focus,
  &.selected {
    outline: 1px solid ${props => props.theme.palette.primary.main};
  }
`

const _FormFieldFloatActions = styled.div`
  position: absolute;
  right: ${props => props.theme.spacing(1)};
  bottom: 100%;
  display: flex;
  align-items: center;
  background-color: ${props => props.theme.palette.background.paper};
  z-index: 10;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
  border: 1px solid ${props => props.theme.palette.primary.main};
  border-bottom: none;
  padding: ${props => props.theme.spacing(0, 1)};

  > .MuiButtonBase-root {
    padding: 0;

    > .MuiSvgIcon-root {
      font-size: 18px;
    }
  }
`

const _Label = styled(Typography)`
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const _DropTargets = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  z-index: 5;

  > div {
    height: 100%;

    &:nth-of-type(1),
    &:nth-of-type(3) {
      flex: 1;
    }

    &:nth-of-type(2) {
      flex: 2;
      display: flex;
      flex-direction: column;

      > div {
        flex: 1;
      }
    }
  }
`

const DropTarget = ({ id, placement }: { id: string; placement: Placement }) => {
  const [isOver, ref] = useDrop<{ type: string; id?: string }, {}, boolean>(
    () => ({
      accept: 'field',
      collect: monitor => monitor.isOver({ shallow: true }),
      drop: item => {
        return { ...item, targetId: id, placement }
      },
    }),
    [id, placement]
  )

  return <_DropTarget ref={ref} className={cx(isOver && 'hover', placement)} />
}

const _DropTarget = styled.div`
  &:after {
    content: '';
    display: block;
    position: absolute;
  }

  &.hover {
    &:after {
      background-color: #1976d2;
      opacity: 0.5;
    }
  }

  &.left {
    &:after {
      right: 100%;
      top: 0;
      bottom: 0;
      width: 8px;
    }
  }

  &.right {
    &:after {
      left: 100%;
      top: 0;
      bottom: 0;
      width: 8px;
    }
  }

  &.top {
    &:after {
      left: 0;
      right: 0;
      bottom: 100%;
      height: 8px;
    }
  }

  &.bottom {
    &:after {
      left: 0;
      right: 0;
      top: 100%;
      height: 8px;
    }
  }
`
