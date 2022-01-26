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
import { Route, Routes, useParams } from 'react-router-dom'
import FormViewHeader from './FormViewHeader'
import RecordTable from './record/RecordTable'

export default function FormView() {
  const { applicationId, formId } = useParams<{ applicationId: string; formId: string }>()
  if (!applicationId || !formId) {
    throw new Error(`Required params applicationId or formId is missing`)
  }

  return (
    <_FormView>
      <Routes>
        <Route index element={<FormViewHeader />} />
        <Route path=":viewId" element={<FormViewHeader />} />
      </Routes>

      <Routes>
        <Route index element={<div />} />
        <Route path=":viewId" element={<RecordTable />} />
      </Routes>
    </_FormView>
  )
}

const _FormView = styled.div`
  display: flex;
  flex-direction: column;
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: white;
`
