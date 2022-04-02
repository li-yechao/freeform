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

import { ApolloProvider } from '@apollo/client'
import { ConfigProvider } from 'antd'
import enUS from 'antd/lib/locale/en_US'
import 'dayjs/locale/en'
import { Suspense, useMemo } from 'react'
import { IntlProvider } from 'react-intl'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { createClient } from './apollo'
import { useViewer } from './apollo/viewer'
import AppBar from './components/AppBar'
import ErrorBoundary from './components/ErrorBoundary'
import NetworkIndicator from './components/NetworkIndicator'
import { ApplicationViewLazy, WorkflowEditViewLazy, WorkflowViewLazy } from './views/application'
import { ErrorViewLazy, NotFoundViewLazy } from './views/error'
import { FormEditViewLazy as FormEditViewLazy } from './views/form'
import { HomeViewLazy } from './views/home'

export default function App() {
  const client = useMemo(() => createClient(), [])

  return (
    <ErrorBoundary.Root fallback={ErrorViewLazy}>
      <ConfigProvider locale={enUS}>
        <ApolloProvider client={client}>
          <RecoilRoot>
            <NetworkIndicator.Provider>
              <IntlProvider locale={navigator.language}>
                <Suspense fallback={<NetworkIndicator in />}>
                  <HashRouter>
                    <AppBar />

                    <ErrorBoundary fallback={ErrorViewLazy}>
                      <AppRoutes />
                    </ErrorBoundary>
                  </HashRouter>
                </Suspense>
              </IntlProvider>
            </NetworkIndicator.Provider>
          </RecoilRoot>
        </ApolloProvider>
      </ConfigProvider>
    </ErrorBoundary.Root>
  )
}

const AppRoutes = () => {
  const viewer = useViewer()

  if (viewer.loading) {
    return null
  } else if (viewer.error) {
    throw viewer.error
  } else {
    return (
      <Routes>
        <Route index element={<HomeViewLazy />} />
        <Route path="/application/:applicationId/*" element={<ApplicationViewLazy />} />
        <Route path="/application/:applicationId/workflow" element={<WorkflowViewLazy />} />
        <Route
          path="/application/:applicationId/workflow/:workflowId/edit"
          element={<WorkflowEditViewLazy />}
        />
        <Route path="/application/:applicationId/:formId/edit" element={<FormEditViewLazy />} />
        <Route path="*" element={<NotFoundViewLazy />} />
      </Routes>
    )
  }
}
