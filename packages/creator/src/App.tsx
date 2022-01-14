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
import { css, Global, ThemeProvider as EmotionThemeProvider } from '@emotion/react'
import styled from '@emotion/styled'
import { AccountCircle, Logout } from '@mui/icons-material'
import {
  AppBar,
  Box,
  CircularProgress,
  createTheme,
  CssBaseline,
  Divider,
  IconButton,
  LinearProgress,
  ListItemIcon,
  MenuItem,
  ThemeProvider as MuiThemeProvider,
  Toolbar,
  Typography,
} from '@mui/material'
import { StylesProvider } from '@mui/styles'
import { SnackbarProvider } from 'notistack'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { IntlProvider } from 'react-intl'
import { HashRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { createClient } from './apollo'
import { useViewerLazyQuery, Viewer } from './apollo/viewer'
import ArrowMenu from './components/ArrowMenu'
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
  const theme = useMemo(() => createTheme(), [])
  const client = useMemo(() => createClient(), [])

  return (
    <ErrorBoundary.Root fallback={ErrorView}>
      <ApolloProvider client={client}>
        <RecoilRoot>
          <NetworkIndicator.Provider>
            <IntlProvider locale={navigator.language}>
              <StylesProvider injectFirst>
                <MuiThemeProvider theme={theme}>
                  <EmotionThemeProvider theme={theme}>
                    <CssBaseline>
                      <Global
                        styles={css`
                          .SnackbarContainer-top {
                            margin-top: 56px;
                          }
                        `}
                      />
                      <SnackbarProvider
                        maxSnack={3}
                        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                      >
                        <Suspense fallback={<NetworkIndicator in />}>
                          <HashRouter>
                            <AppRoutes />
                          </HashRouter>
                        </Suspense>
                      </SnackbarProvider>
                    </CssBaseline>
                  </EmotionThemeProvider>
                </MuiThemeProvider>
              </StylesProvider>
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
    return <Splash />
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

const Splash = () => {
  return (
    <_Splash>
      <CircularProgress />
    </_Splash>
  )
}

const _Splash = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`

const _AppRoutes = () => {
  useAccount()

  return (
    <Routes>
      <Route index element={<HomeViewLazy />} />
      <Route path="/application/:applicationId/*" element={<ApplicationViewLazy />} />
      <Route path="/application/:applicationId/form/:formId/edit" element={<FormEditLazyViwe />} />
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
    <__AppBar position="fixed">
      <Toolbar>
        <Typography variant="h5">Freeform</Typography>

        <Box flexGrow={1} />

        {headerActions.map(i => (
          <i.component {...i.props} key={i.key} />
        ))}
        <AccountButton />
      </Toolbar>

      <NetworkIndicator.Renderer>
        <Box position="fixed" left={0} top={56} right={0} zIndex={t => t.zIndex.tooltip + 1}>
          <LinearProgress />
        </Box>
      </NetworkIndicator.Renderer>
    </__AppBar>
  )
}

const __AppBar = styled(AppBar)`
  background-color: ${props => props.theme.palette.background.default};
  color: ${props => props.theme.palette.text.primary};
  user-select: none;

  .MuiToolbar-root {
    min-height: ${props => props.theme.spacing(7)};
  }
`

const _Body = styled.div`
  padding-top: ${props => props.theme.spacing(7)};
`

const AccountButton = () => {
  const navigate = useNavigate()
  const account = useAccountOrNull()
  const logout = useLogout()
  const [anchorEl, setAnchorEl] = useState<Element>()

  const handleMenuOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(e.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(undefined)
  }

  const handleToMyProfile = () => {
    handleMenuClose()
    if (account) {
      navigate(`/`)
    }
  }

  const handleSignOut = () => {
    handleMenuClose()
    logout()
    navigate(`/`)
  }

  if (!account) {
    return null
  }

  return (
    <>
      <IconButton onClick={handleMenuOpen}>
        <AccountCircle />
      </IconButton>

      <ArrowMenu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        keepMounted
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleToMyProfile}>
          <ListItemIcon>
            <AccountCircle />
          </ListItemIcon>
          My profile
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleSignOut}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Sign out
        </MenuItem>
      </ArrowMenu>
    </>
  )
}
