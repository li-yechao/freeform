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
import { Box, BoxProps } from '@mui/system'
import { ReactNode } from 'react'

export default function AsideLayout({
  left,
  children,
  sx,
}: { left?: ReactNode; children?: ReactNode } & Pick<BoxProps, 'sx'>) {
  return (
    <_AsideLayout sx={sx}>
      <aside>{left}</aside>
      <main>{children}</main>
    </_AsideLayout>
  )
}

const _AsideLayout = styled(Box)`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;

  > aside {
    position: relative;
    width: 200px;
    height: 100%;
    overflow: auto;
    background-color: #ffffff;
  }

  > main {
    position: relative;
    flex: 1;
    height: 100%;
    overflow: auto;
    border-left: 1px solid #efefef;
  }
`
