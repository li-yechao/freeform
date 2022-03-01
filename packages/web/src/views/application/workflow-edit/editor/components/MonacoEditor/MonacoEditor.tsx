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
import { editor, languages, Uri } from 'monaco-editor'
import { useRef, useEffect } from 'react'
import './monaco.vite'

export type MonacoInstance = {
  editor: editor.ICodeEditor
}

export interface MonacoEditorProps {
  className?: string
  value?: string
  extraLibs?: { content: string }[]
  onChange?: (value: string) => void
}

export default function MonacoEditor(props: MonacoEditorProps) {
  const valueRef = useRef(props.value)
  const container = useRef<HTMLDivElement>(null)
  const monacoEditor = useRef<editor.ICodeEditor>()

  useEffect(() => {
    languages.typescript.typescriptDefaults.setCompilerOptions({
      lib: ['esnext', 'es2015'],
      target: languages.typescript.ScriptTarget.ESNext,
      allowNonTsExtensions: true,
      allowJs: true,
      checkJs: true,
      strict: true,
    })

    languages.typescript.typescriptDefaults.setExtraLibs(props.extraLibs ?? [])
  }, [props.extraLibs])

  useEffect(() => {
    if (!container.current) {
      return
    }

    monacoEditor.current = editor.create(container.current, {
      model: createModel(props.value),
      automaticLayout: true,
      minimap: {
        enabled: true,
      },
      rulers: [80, 100],
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
      model?.dispose()
    }
  }, [])

  useEffect(() => {
    if (props.value !== valueRef.current) {
      valueRef.current = props.value
      monacoEditor.current?.setValue(valueRef.current || '')
    }
  }, [props.value])

  return <_Editor className={props.className} ref={container} />
}

function createModel(value?: string) {
  const model = editor.createModel(value || '', 'typescript', Uri.file(`main.ts`))
  model.updateOptions({ tabSize: 2, insertSpaces: true })
  return model
}

const _Editor = styled.div`
  height: 100%;
`
