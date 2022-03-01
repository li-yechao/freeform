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

import { Button } from 'antd'
import { useEffect } from 'react'
import { Route, Routes, useNavigate, useParams } from 'react-router-dom'
import AsideLayout from '../../components/Layout/AsideLayout'
import { HeaderAction, useHeaderActionsCtrl } from '../../state/header'
import { FormLazyView } from '../form'
import ApplicationScriptButton from './ApplicationScriptButton'
import FormList from './FormList'
import { useApplication } from './graphql'

export default function ApplicationView() {
  const { applicationId } = useParams<'applicationId'>()
  if (!applicationId) {
    throw new Error('Required parameter applicationId is missing')
  }

  const headerActionsCtrl = useHeaderActionsCtrl()
  const navigate = useNavigate()

  useEffect(() => {
    const workflowButton: HeaderAction<React.ComponentProps<typeof Button.Group>> = {
      key: 'ApplicationView-WorkflowButton',
      component: Button.Group,
      props: {
        children: (
          <>
            <Button type="link" onClick={() => navigate(`/application/${applicationId}/workflow`)}>
              工作流
            </Button>
            <ApplicationScriptButton applicationId={applicationId} />
          </>
        ),
      },
    }
    headerActionsCtrl.set(workflowButton)

    return () => headerActionsCtrl.remove(workflowButton)
  }, [applicationId])

  return (
    <AsideLayout
      sx={{ pt: 6 }}
      left={
        <Routes>
          <Route index element={<FormList />} />
          <Route path=":formId/*" element={<FormList />} />
        </Routes>
      }
    >
      <Routes>
        <Route index element={<IndexView />} />
        <Route path=":formId/*" element={<FormLazyView />} />
      </Routes>
    </AsideLayout>
  )
}

const IndexView = () => {
  const { applicationId } = useParams<'applicationId'>()
  if (!applicationId) {
    throw new Error('Required parameter applicationId is missing')
  }

  const navigate = useNavigate()
  const { data: { application } = {} } = useApplication({ variables: { applicationId } })

  useEffect(() => {
    const firstFormId = application?.forms.at(0)?.id
    if (firstFormId) {
      navigate(firstFormId, { replace: true })
    }
  }, [application])

  return null
}
