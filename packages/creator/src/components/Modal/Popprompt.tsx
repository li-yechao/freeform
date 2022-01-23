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
import { Box } from '@mui/system'
import { Button, Form, Input, Tooltip, TooltipProps } from 'antd'
import { ChangeEvent, KeyboardEvent, MouseEvent, useCallback, useEffect, useState } from 'react'

export type PoppromptProps = {
  value?: string
  error?: Error
  title?: string
  placeholder?: string
  onSubmit?: (value: string) => void
} & Partial<TooltipProps>

export default function Popprompt({
  value,
  error,
  title,
  placeholder,
  onSubmit,
  ...props
}: PoppromptProps) {
  const [val, setVal] = useState(value ?? '')

  useEffect(() => {
    setVal(value ?? '')
  }, [value])

  const handleClose = useCallback(() => props.onVisibleChange?.(false), [props.onVisibleChange])

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => setVal(e.target.value), [])

  const handleSubmit = (e?: MouseEvent) => (e?.preventDefault(), onSubmit?.(val))

  const handleKeyUp = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleClose])

  return (
    <_Tooltip
      placement="bottom"
      color="white"
      trigger="click"
      arrowPointAtCenter
      destroyTooltipOnHide
      overlayInnerStyle={{ padding: 0 }}
      overlay={() => (
        <Box sx={{ p: 1, maxWidth: 300 }} onClick={e => e.stopPropagation()}>
          <Form>
            <Form.Item
              validateStatus={error ? 'error' : ''}
              help={error?.message}
              style={{ marginBottom: 0 }}
            >
              <Input
                autoFocus
                size="small"
                placeholder={placeholder}
                value={val}
                onChange={handleChange}
                autoComplete="off"
                onKeyUp={handleKeyUp}
              />
            </Form.Item>

            <Box mt={1} textAlign="right">
              <Button size="small" onClick={handleClose} style={{ marginRight: 8 }}>
                取消
              </Button>
              <Button size="small" type="primary" htmlType="submit" onClick={handleSubmit}>
                确定
              </Button>
            </Box>
          </Form>
        </Box>
      )}
      {...props}
    />
  )
}

const _Tooltip = styled(Tooltip)``
