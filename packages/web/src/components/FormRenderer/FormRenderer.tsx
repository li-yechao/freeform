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
import { Col, Row } from 'antd'
import { memo, useEffect, useRef } from 'react'
import { RecoilRoot } from 'recoil'
import { Field } from '../FormCreator'
import FieldRenderer, { FieldProps } from '../FormCreator/field'
import { useFieldValue, useSetFieldValue, useSetValue, useValue, Value } from './state'

export interface FormRendererProps {
  applicationId: string
  formId: string
  fields: { [key: string]: Field }
  layout: string[][]
  value?: Value
  onChange?: (value: Value) => void
}

export default function FormRenderer(props: FormRendererProps) {
  return (
    <RecoilRoot>
      <_FormRenderer {...props} />
    </RecoilRoot>
  )
}

const _FormRenderer = ({ fields, layout, ...props }: FormRendererProps) => {
  const setValue = useSetValue()
  const value = useValue()
  const ref = useRef<Value>()

  useEffect(() => {
    if (ref.current !== props.value) {
      ref.current = props.value || { data: {} }
      setValue(ref.current)
    }
  }, [props.value])

  useEffect(() => {
    if (ref.current !== value) {
      ref.current = value
      props.onChange?.(value)
    }
  }, [value])

  return (
    <_Form>
      {layout.map((row, index) => (
        <Row key={index}>
          {row.map(id => (
            <Col key={id} xs={Math.max(3, 24 / row.length)}>
              <FormField
                {...fields[id]!}
                applicationId={props.applicationId}
                formId={props.formId}
              />
            </Col>
          ))}
        </Row>
      ))}
    </_Form>
  )
}

const FormField = memo((field: FieldProps) => {
  const value = useFieldValue(field.id)
  const setValue = useSetFieldValue()

  return (
    <_FormField>
      <_Label>{field.label}</_Label>

      <FieldRenderer {...field} value={value} onChange={value => setValue(field.id, value)} />
    </_FormField>
  )
})

const _Form = styled.div``

const _FormField = styled(Box)`
  position: relative;
  margin: 4px;
  padding: 4px;
  border-radius: 4px;
  min-height: 50px;
  cursor: pointer;
`

const _Label = styled.div`
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`
