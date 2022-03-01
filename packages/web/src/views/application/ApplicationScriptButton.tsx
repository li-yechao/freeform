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
import { Button, Modal } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useToggle } from 'react-use'
import { useApplicationScript, useUpdateApplicationScript } from './graphql'
import MonacoEditor from './workflow-edit/editor/components/MonacoEditor/MonacoEditor'
import { formatJs } from './workflow-edit/editor/prettier'

export default function ApplicationScriptButton({ applicationId }: { applicationId: string }) {
  const [visible, toggleVisible] = useToggle(false)

  return (
    <Button type="link" onClick={toggleVisible}>
      脚本配置
      {visible && (
        <ApplicationScriptModal
          applicationId={applicationId}
          visible={visible}
          onClose={() => toggleVisible(false)}
        />
      )}
    </Button>
  )
}

const ApplicationScriptModal = ({
  applicationId,
  visible,
  onClose,
}: {
  applicationId: string
  visible?: boolean
  onClose?: () => void
}) => {
  const { data: { application } = {} } = useApplicationScript({ variables: { applicationId } })
  const [updaetApplication] = useUpdateApplicationScript()

  const [script, setScript] = useState('')

  useEffect(() => {
    setScript(application?.thirdScript || '')
  }, [application?.thirdScript])

  const handleSave = () => {
    updaetApplication({ variables: { applicationId, input: { thirdScript: formatJs(script) } } })
    onClose?.()
  }

  const defines = useApplicationScriptDefines()

  return (
    <div
      onClick={e => e.stopPropagation()}
      onKeyDown={e => {
        if (e.metaKey && e.key === 's') {
          e.preventDefault()
          e.stopPropagation()
          handleSave()
        }
      }}
    >
      <_Modal
        title="脚本配置"
        visible={visible}
        closable={false}
        maskClosable={false}
        width=""
        onOk={handleSave}
        onCancel={onClose}
      >
        {!!application && (
          <MonacoEditor value={script || defaultScript} extraLibs={defines} onChange={setScript} />
        )}
      </_Modal>
    </div>
  )
}

const _Modal = styled(Modal)`
  height: 90%;
  width: 90%;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  margin: auto;

  > .ant-modal-content {
    height: 100%;
    display: flex;
    flex-direction: column;

    > .ant-modal-body {
      flex: 1;
    }
  }
`

const defaultScript = `\
export default class implements ThirdUserModule {
}
`

const useApplicationScriptDefines = () => {
  return useMemo(() => {
    const defines: { content: string }[] = []

    defines.push({
      content: `
type BodyInit = Blob | BufferSource | FormData | URLSearchParams | string;

type HeadersInit = string[][] | Record<string, string>;

interface RequestInit {
  body?: BodyInit | null;
  headers?: HeadersInit;
  method?: string;
}

interface Body {
    readonly body: ReadableStream<Uint8Array> | null;
    readonly bodyUsed: boolean;
    arrayBuffer(): Promise<ArrayBuffer>;
    blob(): Promise<Blob>;
    formData(): Promise<FormData>;
    json(): Promise<any>;
    text(): Promise<string>;
}

interface Headers {
  append(name: string, value: string): void;
  delete(name: string): void;
  get(name: string): string | null;
  has(name: string): boolean;
  set(name: string, value: string): void;
  forEach(callbackfn: (value: string, key: string, parent: Headers) => void, thisArg?: any): void;
}

type ResponseType = "basic" | "cors" | "default" | "error" | "opaque" | "opaqueredirect";

interface Response extends Body {
  readonly headers: Headers;
  readonly ok: boolean;
  readonly redirected: boolean;
  readonly status: number;
  readonly statusText: string;
  readonly type: ResponseType;
  readonly url: string;
}

declare function fetch(input: string, init?: RequestInit): Promise<Response>;
`,
    })

    defines.push({
      content: `
declare interface ThirdUserModule {
  getDepartments(
    query?: { departmentId?: string; departmentIds?: string[] }
  ): Promise<{ id: string; name: string; parentId?: string }[]>

  getDepartment(
    query: { departmentId: string }
  ): Promise<{ id: string; name: string; parentId?: string }>

  getUsers(
    query: { departmentId?: string; userIds?: string[] }
  ): Promise<{ id: string; name: string; departmentId: string }[]>

  getUser(
    query: { userId: string }
  ): Promise<{ id: string; name: string; departmentId: string }>
}
`,
    })

    return defines
  }, [])
}
