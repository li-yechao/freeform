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
import { Input, Radio, Typography } from 'antd'
import { memo } from 'react'
import { ConfigureRenderer } from './field'
import { useCurrentField, useSetField } from './state'

export default function Configure({ applicationId }: { applicationId: string }) {
  const field = useCurrentField()
  const setField = useSetField()

  if (!field) {
    return null
  }

  return (
    <_Configure p={2}>
      <LabelConfigure />

      <StateConfigure />

      <ConfigureRenderer
        applicationId={applicationId}
        field={field}
        setField={value => setField(field.id, value)}
      />
    </_Configure>
  )
}

const _Configure = styled(Box)``

const LabelConfigure = memo(() => {
  const field = useCurrentField()
  const setField = useSetField()

  if (!field) {
    return null
  }

  return (
    <Box my={2}>
      <Typography.Text type="secondary">标题</Typography.Text>

      <Input value={field.label} onChange={e => setField(field.id, { label: e.target.value })} />
    </Box>
  )
})

const StateConfigure = memo(() => {
  const field = useCurrentField()
  const setField = useSetField()

  if (!field) {
    return null
  }

  return (
    <Box my={2}>
      <Typography.Text type="secondary">状态</Typography.Text>

      <Box>
        <Radio.Group
          value={field.state || 'NORMAL'}
          onChange={e => {
            setField(field.id, {
              state: e.target.value === 'NORMAL' ? undefined : (e.target.value as any),
            })
          }}
        >
          <Radio value="NORMAL" children="正常" />
          <Radio value="READONLY" children="只读" />
          <Radio value="DISABLED" children="禁用" />
        </Radio.Group>
      </Box>
    </Box>
  )
})
