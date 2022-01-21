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

import { Box, CircularProgress, Fade, LinearProgress, Paper, Typography } from '@mui/material'
import { useSnackbar } from 'notistack'
import { useEffect } from 'react'
import { useToggle } from 'react-use'
import { queryViewerWithToken, Viewer } from '../../apollo/viewer'
import { useLogin } from '../../state/account'
import useAsync from '../../utils/useAsync'

export default function AuthView() {
  const [loading, toggleLoading] = useToggle(false)
  const snackbar = useSnackbar()

  const result = useAsync(async () => {
    const DTFrameLogin = await (async () => {
      const win: { DTFrameLogin?: Function } = window as any

      if (typeof win.DTFrameLogin !== 'undefined') {
        return win.DTFrameLogin
      }

      return await new Promise<Function>((resolve, reject) => {
        const script = document.createElement('script')
        script.src = 'https://g.alicdn.com/dingding/h5-dingtalk-login/0.21.0/ddlogin.js'
        script.onload = () => {
          if (typeof win.DTFrameLogin !== 'undefined') {
            resolve(win.DTFrameLogin)
          } else {
            reject(new Error('Load dingtalk auth js failed'))
          }
        }
        script.onerror = e => {
          reject(new Error(e.toString()))
        }
        document.body.append(script)
      })
    })()

    return new Promise<{ viewer: Viewer; accessToken: string } | undefined>((resolve, reject) => {
      let loading = false

      DTFrameLogin(
        { id: 'dingtalk-qr-code', width: 300, height: 300 },
        {
          redirect_uri: encodeURIComponent(`${window.location.origin}/auth/dingtalk`),
          client_id: import.meta.env.VITE_DINGTALK_CLIENT_ID,
          scope: 'openid',
          response_type: 'code',
          state: '1234',
          prompt: 'consent',
        },
        async (result: any) => {
          if (loading) {
            return
          }
          loading = true

          try {
            toggleLoading(true)
            const token = await fetch(
              `${import.meta.env.VITE_AUTH_API}/auth/dingtalk?code=${result.authCode}`,
              { method: 'POST' }
            ).then(res => {
              if (res.status >= 200 && res.status < 300) {
                return res.json()
              }
              throw new Error(res.statusText)
            })

            const viewer = await queryViewerWithToken(token.accessToken)
            resolve({ viewer, accessToken: token.accessToken })

            snackbar.enqueueSnackbar('登录成功', { variant: 'success' })
          } catch (error: any) {
            loading = false
            snackbar.enqueueSnackbar(error.message, { variant: 'error' })
          } finally {
            toggleLoading(false)
          }
        },
        (errorMsg: string) => {
          reject(new Error(errorMsg))
        }
      )
    })
  }, [])

  useEffect(() => {
    if (result.error) {
      snackbar.enqueueSnackbar(result.error.message, { variant: 'error' })
    }
  }, [result.error])

  const login = useLogin()

  useEffect(() => {
    if (result.value) {
      login(result.value)
    }
  }, [result.value])

  return (
    <Paper
      sx={{
        position: 'relative',
        overflow: 'hidden',
        maxWidth: 500,
        margin: 'auto',
        marginTop: 4,
        padding: 2,
      }}
    >
      <Box position="absolute" left={0} top={0} right={0}>
        <Fade in={loading}>
          <LinearProgress />
        </Fade>
      </Box>

      <Typography variant="h5" color="primary" align="center">
        智能表单
      </Typography>
      <Box mt={2}>
        <Typography variant="subtitle1" align="center">
          登录
        </Typography>
      </Box>

      <Box position="relative">
        <Box
          position="absolute"
          left={0}
          top={0}
          right={0}
          bottom={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={0}
        >
          <CircularProgress />
        </Box>
        <Box position="relative" id="dingtalk-qr-code" width={300} height={300} margin="auto" />
      </Box>

      <Box textAlign="center">
        <Typography variant="caption">使用钉钉扫码登录</Typography>
      </Box>
    </Paper>
  )
}
