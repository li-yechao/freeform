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

import { css, Global, ThemeProvider as EmotionThemeProvider } from '@emotion/react'
import styled from '@emotion/styled'
import {
  AppBar,
  Box,
  createTheme,
  CssBaseline,
  ThemeProvider as MuiThemeProvider,
  Toolbar,
  Typography,
} from '@mui/material'
import { StylesProvider } from '@mui/styles'
import { SnackbarProvider } from 'notistack'
import { useMemo } from 'react'
import { HashRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'

export default function App() {
  const theme = useMemo(() => createTheme(), [])

  return (
    <RecoilRoot>
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
                <HashRouter>
                  <AppRoutes />
                </HashRouter>
              </SnackbarProvider>
            </CssBaseline>
          </EmotionThemeProvider>
        </MuiThemeProvider>
      </StylesProvider>
    </RecoilRoot>
  )
}

const AppRoutes = () => {
  return (
    <>
      <_AppBar />
    </>
  )
}

const _AppBar = () => {
  return (
    <__AppBar position="fixed">
      <Toolbar>
        <Typography variant="h5">Freeform</Typography>

        <Box flexGrow={1} />
      </Toolbar>
    </__AppBar>
  )
}

const __AppBar = styled(AppBar)`
  background-color: ${props => props.theme.palette.background.default};
  color: ${props => props.theme.palette.text.primary};
  user-select: none;
  -webkit-app-region: drag;

  button {
    -webkit-app-region: none;
  }

  .MuiToolbar-root {
    min-height: ${props => props.theme.spacing(7)};
  }
`
