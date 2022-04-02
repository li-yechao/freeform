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
import { message, Spin, Typography } from 'antd'
import { useEffect } from 'react'
import { useToggle } from 'react-use'
import auth from '../../apollo/auth'
import NetworkIndicator from '../../components/NetworkIndicator'
import { DINGTALK_CLIENT_ID } from '../../constants'
import { useLogin } from '../../state/account'
import { Token } from '../../Storage'
import useAsync from '../../utils/useAsync'

export default function AuthView() {
  const [loading, toggleLoading] = useToggle(false)

  const result = useAsync(async () => {
    const DTFrameLogin = await (async () => {
      const win: { DTFrameLogin?: (...options: any[]) => void } = window as any

      if (typeof win.DTFrameLogin !== 'undefined') {
        return win.DTFrameLogin
      }

      return await new Promise<(...options: any[]) => void>((resolve, reject) => {
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

    return new Promise<{ token: Token } | undefined>((resolve, reject) => {
      let loading = false

      DTFrameLogin(
        { id: 'dingtalk-qr-code', width: 300, height: 300 },
        {
          redirect_uri: encodeURIComponent(`${window.location.origin}/auth/dingtalk`),
          client_id: DINGTALK_CLIENT_ID,
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
            const token = await auth({ type: 'dingtalk', input: { code: result.authCode } })
            resolve({ token })

            message.success('登录成功')
          } catch (error: any) {
            loading = false
            message.error(error.message)
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
      message.error(result.error.message)
    }
  }, [result.error])

  const login = useLogin()

  useEffect(() => {
    if (result.value) {
      login(result.value)
    }
  }, [result.value])

  return (
    <_Form>
      <NetworkIndicator in={loading} />

      <Box sx={{ textAlign: 'center' }}>
        <Typography.Title level={3}>Freeform</Typography.Title>

        <Box mt={2}>
          <Typography.Paragraph>Login</Typography.Paragraph>
        </Box>
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
          <Spin />
        </Box>
        <Box position="relative" id="dingtalk-qr-code" width={300} height={300} margin="auto" />
      </Box>

      <Box textAlign="center">
        <Typography.Paragraph type="secondary">
          Use Dingtalk scan qr code to login
        </Typography.Paragraph>
      </Box>
    </_Form>
  )
}

const _Form = styled.form`
  position: relative;
  overflow: hidden;
  max-width: 500px;
  margin: 40px auto;
  padding: 16px;
  background-color: #ffffff;
  border-radius: 8px;
`
