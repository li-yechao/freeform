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
import Title from 'antd/lib/typography/Title'

export default function ErrorView({ error }: { error?: Error }) {
  return (
    <Box sx={{ textAlign: 'center', mt: 5 }}>
      <Title level={1} type="secondary">
        {error?.name || 'Error'}
      </Title>

      <_Message level={5} type="secondary">
        {error?.message || 'Unknown Error'}
      </_Message>
    </Box>
  )
}

const _Message = styled(Title)`
  word-wrap: break-word;
`
