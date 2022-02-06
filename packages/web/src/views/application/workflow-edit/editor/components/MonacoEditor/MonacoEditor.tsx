// Copyright 2021 LiYechao
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
import { editor } from 'monaco-editor'
import { useRef, useEffect } from 'react'
import './monaco.vite'

export type MonacoInstance = {
  editor: editor.ICodeEditor
}

export interface MonacoEditorProps {
  className?: string
  language?: string
  value?: string
  onChange?: (value: string) => void
}

export default function MonacoEditor(props: MonacoEditorProps) {
  const valueRef = useRef(props.value)
  const container = useRef<HTMLDivElement>(null)
  const monacoEditor = useRef<editor.ICodeEditor>()

  useEffect(() => {
    if (!container.current) {
      return
    }

    monacoEditor.current = editor.create(container.current, {
      model: createModel(props.value, props.language),
      language: props.language,
      automaticLayout: true,
      minimap: {
        enabled: true,
      },
      scrollbar: {
        verticalScrollbarSize: 4,
        horizontalScrollbarSize: 4,
        alwaysConsumeMouseWheel: false,
      },
      renderWhitespace: 'all',
      scrollBeyondLastLine: false,
    })

    const model = monacoEditor.current.getModel()

    model?.onDidChangeContent(() => {
      valueRef.current = model.getValue()
      props.onChange?.(valueRef.current)
    })

    return () => {
      monacoEditor.current?.dispose()
    }
  }, [])

  useEffect(() => {
    if (props.value !== valueRef.current) {
      valueRef.current = props.value
      monacoEditor.current?.setValue(valueRef.current || '')
    }
  }, [props.value])

  useEffect(() => {
    const model = monacoEditor.current?.getModel()
    model && editor.setModelLanguage(model, props.language || 'plaintext')
  }, [props.language])

  return <_Editor className={props.className} ref={container} />
}

function createModel(value?: string, language?: string) {
  const model = editor.createModel(value || '', language)
  model.updateOptions({ tabSize: 2 })
  return model
}

const _Editor = styled.div`
  height: 100%;
`
