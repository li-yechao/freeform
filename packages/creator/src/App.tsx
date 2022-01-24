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

import { HomeOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons'
import { ApolloProvider } from '@apollo/client'
import styled from '@emotion/styled'
import { Box } from '@mui/system'
import { Button, Dropdown, Menu, Typography } from 'antd'
import { Suspense, useEffect, useMemo } from 'react'
import { IntlProvider } from 'react-intl'
import { HashRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { createClient } from './apollo'
import { useViewerLazyQuery, Viewer } from './apollo/viewer'
import ErrorBoundary from './components/ErrorBoundary'
import NetworkIndicator from './components/NetworkIndicator'
import {
  isUnauthorizedError,
  useAccountOrNull,
  useSetAccount,
  useAccount,
  useLogout,
} from './state/account'
import { useHeaderActions } from './state/header'
import useAsync from './utils/useAsync'
import { ApplicationViewLazy } from './views/application'
import { AuthViewLazy } from './views/auth'
import { ErrorViewLazy, NotFoundViewLazy } from './views/error'
import ErrorView from './views/error/ErrorView'
import { FormEditLazyViwe } from './views/form'
import { HomeViewLazy } from './views/home'

export default function App() {
  const client = useMemo(() => createClient(), [])

  return (
    <ErrorBoundary.Root fallback={ErrorView}>
      <ApolloProvider client={client}>
        <RecoilRoot>
          <NetworkIndicator.Provider>
            <IntlProvider locale={navigator.language}>
              <Suspense fallback={<NetworkIndicator in />}>
                <HashRouter>
                  <AppRoutes />
                </HashRouter>
              </Suspense>
            </IntlProvider>
          </NetworkIndicator.Provider>
        </RecoilRoot>
      </ApolloProvider>
    </ErrorBoundary.Root>
  )
}

const AppRoutes = () => {
  const [queryViewer] = useViewerLazyQuery()
  const setAccount = useSetAccount()
  const accountState = useAsync(async () => {
    // NOTE: Set account into globalThis at development environment (avoid hot
    // module replacement recreate account instance).
    const g: { __VIEWER__?: Promise<Viewer | null> } = import.meta.env.PROD
      ? {}
      : (globalThis as any)

    if (!g.__VIEWER__) {
      g.__VIEWER__ = queryViewer().then(res => res.data?.viewer ?? null)
    }

    const viewer = await g.__VIEWER__
    if (viewer) {
      setAccount(viewer)
    }
  }, [])

  if (accountState.error) {
    throw accountState.error
  }

  if (accountState.loading) {
    return null
  }

  return (
    <>
      <_AppBar />

      <_Body>
        <ErrorBoundary fallback={ErrorViewLazy}>
          <ErrorBoundary fallback={UnauthorizedErrorBoundary}>
            <_AppRoutes />
          </ErrorBoundary>
        </ErrorBoundary>
      </_Body>
    </>
  )
}

const _AppRoutes = () => {
  useAccount()

  return (
    <Routes>
      <Route index element={<HomeViewLazy />} />
      <Route path="/application/:applicationId/*" element={<ApplicationViewLazy />} />
      <Route path="/application/:applicationId/:formId/edit" element={<FormEditLazyViwe />} />
      <Route path="*" element={<NotFoundViewLazy />} />
    </Routes>
  )
}

function UnauthorizedErrorBoundary({ error, reset }: { error: Error; reset: () => void }) {
  const account = useAccountOrNull()

  useEffect(() => {
    if (account) {
      reset()
    }
  }, [account, reset])

  if (isUnauthorizedError(error)) {
    return <AuthViewLazy />
  }

  throw error
}

const _AppBar = () => {
  const headerActions = useHeaderActions()

  return (
    <__AppBar>
      <Typography.Title level={4}>智能表单</Typography.Title>

      <Box flexGrow={1} />

      {headerActions.map(i => (
        <Box key={i.key} sx={{ mx: 1 }}>
          <i.component {...i.props} />
        </Box>
      ))}

      <AccountButton />

      <NetworkIndicator.Renderer>
        <Box position="fixed" left={0} top={48} right={0}></Box>
      </NetworkIndicator.Renderer>
    </__AppBar>
  )
}

const __AppBar = styled.header`
  background-color: #ffffff;
  user-select: none;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid #efefef;
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 48px;
  z-index: 100;

  > h4 {
    margin: 0;
  }
`

const _Body = styled.div`
  padding-top: 48px;
`

const AccountButton = () => {
  const navigate = useNavigate()
  const account = useAccountOrNull()
  const logout = useLogout()

  const handleToHome = () => {
    if (account) {
      navigate(`/`)
    }
  }

  const handleSignOut = () => {
    logout()
    navigate(`/`)
  }

  if (!account) {
    return null
  }

  const menu = (
    <Menu>
      <Menu.Item key="home" icon={<HomeOutlined />} onClick={handleToHome}>
        首页
      </Menu.Item>
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleSignOut}>
        注销登录
      </Menu.Item>
    </Menu>
  )

  return (
    <Box sx={{ mx: 1 }}>
      <Dropdown overlay={menu} trigger={['click']} arrow>
        <Button shape="circle">
          <UserOutlined />
        </Button>
      </Dropdown>
    </Box>
  )
}
