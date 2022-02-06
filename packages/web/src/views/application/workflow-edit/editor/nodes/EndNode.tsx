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

export default function EndNode() {
  return (
    <div>
      <_Container>结束</_Container>
    </div>
  )
}

const _Container = styled.div`
  height: 40px;
  border-radius: 20px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #6e6e6e;
  color: #ffffff;
  box-shadow: 0 1px 5px 0 rgb(10 30 65 / 8%);
`
