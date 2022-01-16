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
import {
  Box,
  Button,
  ClickAwayListener,
  FormControl,
  FormHelperText,
  FormLabel,
  Paper,
  Popper,
  PopperProps,
  TextField,
} from '@mui/material'
import {
  ChangeEvent,
  KeyboardEventHandler,
  MouseEventHandler,
  useCallback,
  useEffect,
  useState,
} from 'react'

export interface PromptProps extends Pick<PopperProps, 'open' | 'anchorEl'> {
  value?: string
  error?: Error
  title?: string
  placeholder?: string
  onClose?: () => void
  onSubmit?: (value: string) => void
}

export default function Prompt({
  value,
  error,
  title,
  placeholder,
  open,
  anchorEl,
  onClose,
  onSubmit,
}: PromptProps) {
  const [arrowRef, setArrowRef] = useState<Element | null>(null)

  const [val, setVal] = useState(value ?? '')

  useEffect(() => {
    setVal(value ?? '')
  }, [value])

  const handleClose = useCallback(() => onClose?.(), [onClose])

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => setVal(e.target.value), [])

  const handleSubmit: MouseEventHandler = e => (e.preventDefault(), onSubmit?.(val))

  const handleKeyUp: KeyboardEventHandler = useCallback(e => {
    if (e.key === 'Escape') {
      onClose?.()
    }
  }, [])

  return (
    <_Popper
      onKeyUp={handleKeyUp}
      open={open}
      anchorEl={anchorEl}
      modifiers={[
        {
          name: 'flip',
          enabled: true,
          options: {
            altBoundary: false,
            rootBoundary: 'viewport',
            padding: 8,
          },
        },
        {
          name: 'preventOverflow',
          enabled: true,
          options: {
            altAxis: true,
            altBoundary: false,
            tether: false,
            rootBoundary: 'viewport',
            padding: 8,
          },
        },
        {
          name: 'arrow',
          enabled: true,
          options: {
            element: arrowRef,
          },
        },
        {
          name: 'offset',
          options: {
            offset: ({ placement }: { placement: string }) => {
              if (placement.includes('bottom') || placement.includes('top')) {
                return [0, 10]
              } else if (placement.includes('left') || placement.includes('right')) {
                return [10, 0]
              }
              return [0, 0]
            },
          },
        },
      ]}
    >
      <span className="MuiPopper-arrow" ref={setArrowRef} />

      <ClickAwayListener
        mouseEvent="onMouseDown"
        touchEvent="onTouchStart"
        onClickAway={handleClose}
      >
        <Paper component="form" sx={{ p: 3, maxWidth: 300 }} elevation={0}>
          <FormControl>
            <FormLabel>{title}</FormLabel>

            <TextField
              autoFocus
              error={Boolean(error)}
              size="small"
              placeholder={placeholder}
              value={val}
              onChange={handleChange}
              autoComplete="off"
            />

            {error && (
              <FormHelperText error sx={{ wordBreak: 'break-all' }}>
                {error.message}
              </FormHelperText>
            )}
          </FormControl>

          <Box mt={2} textAlign="right">
            <Button size="small" onClick={handleClose}>
              取消
            </Button>
            <Button size="small" variant="contained" type="submit" onClick={handleSubmit}>
              确定
            </Button>
          </Box>
        </Paper>
      </ClickAwayListener>
    </_Popper>
  )
}

const _Popper = styled(Popper)`
  filter: drop-shadow(0px 2px 8px rgba(0, 0, 0, 0.32));

  .MuiPopper-arrow {
    position: absolute;
    font-size: 7px;
    width: 3em;
    height: 3em;

    &:before {
      content: '';
      display: block;
      width: 0;
      height: 0;
      border-style: solid;
      margin: auto;
    }
  }

  &[data-popper-placement*='bottom'] {
    margin-top: 8px;

    & .MuiPopper-arrow {
      top: 0;
      left: 0;
      width: 3em;
      margin-top: -0.7em;
      height: 1em;

      &:before {
        border-width: 0 1em 1em 1em;
        border-color: transparent transparent ${props => props.theme.palette.background.paper}
          transparent;
      }
    }
  }

  &[data-popper-placement*='top'] {
    > div {
      margin-bottom: 2px;
    }

    & .MuiPopper-arrow {
      bottom: 0;
      left: 0;
      margin-bottom: -0.7em;
      width: 3em;
      height: 1em;

      &:before {
        border-width: 1em 1em 0 1em;
        border-color: ${props => props.theme.palette.background.paper} transparent transparent
          transparent;
      }
    }
  }

  &[data-popper-placement*='right'] {
    & .MuiPopper-arrow {
      left: 0;
      margin-left: -0.7em;
      height: 3em;
      width: 1em;

      &:before {
        border-width: 1em 1em 1em 0;
        border-color: transparent ${props => props.theme.palette.background.paper} transparent
          transparent;
      }
    }
  }

  &[data-popper-placement*='left'] {
    & .MuiPopper-arrow {
      right: 0;
      margin-right: -0.7em;
      height: 3em;
      width: 1em;

      &:before {
        border-width: 1em 0 1em 1em;
        border-color: transparent transparent transparent
          ${props => props.theme.palette.background.paper};
      }
    }
  }
`
