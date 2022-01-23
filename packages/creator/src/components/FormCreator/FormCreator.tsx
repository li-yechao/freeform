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
import { useEffect, useRef } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { RecoilRoot } from 'recoil'
import Configure from './Configure'
import Fields from './Fields'
import Form from './Form'
import { Schema, useSchema, useSetSchema } from './state'

export interface FormCreatorProps {
  value?: Schema
  onChange?: (value: Schema) => void
}

export default function FormCreator(props: FormCreatorProps) {
  return (
    <RecoilRoot>
      <DndProvider backend={HTML5Backend}>
        <_FormCreator {...props} />
      </DndProvider>
    </RecoilRoot>
  )
}

const _FormCreator = (props: FormCreatorProps) => {
  const setState = useSetSchema()
  const state = useSchema()
  const ref = useRef<Schema>()

  useEffect(() => {
    if (ref.current !== props.value) {
      ref.current = props.value || { fields: {}, layout: [] }
      setState(ref.current)
    }
  }, [props.value])

  useEffect(() => {
    if (ref.current !== state) {
      ref.current = state
      props.onChange?.(state)
    }
  }, [state])

  return (
    <_Container>
      <aside>
        <Fields />
      </aside>
      <main>
        <Box sx={{ backgroundColor: 'white' }}>
          <Form />
        </Box>
      </main>
      <aside>
        <Configure />
      </aside>
    </_Container>
  )
}

const _Container = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;

  > aside {
    width: 300px;
    overflow: auto;
    background-color: white;
  }

  > main {
    flex: 1;
    overflow: auto;
    padding: 16px 8px;
    border-left: 1px solid #f5f5f5;
    border-right: 1px solid #f5f5f5;
  }
`
