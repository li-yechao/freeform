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

import { CaretDownOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { Box } from '@mui/system'
import { Button, Dropdown, Menu, message, Typography } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useToggle } from 'react-use'
import Popprompt, { PoppromptProps } from '../../components/Modal/Popprompt'
import { cx } from '../../utils/cx'
import {
  Application,
  useApplicationFormViews,
  useCreateView,
  useDeleteView,
  useUpdateView,
  View,
} from './graphql'
import RecordCreator from './record/RecordCreator'

export default function FormViewHeader() {
  const { applicationId, formId, viewId } = useParams<'applicationId' | 'formId' | 'viewId'>()
  if (!applicationId || !formId) {
    throw new Error('Required parameter applicationId or formId is missing')
  }

  const navigate = useNavigate()
  const [createView, { data: newViewData, reset: resetNewViewData }] = useCreateView()

  const { data: { application } = {} } = useApplicationFormViews({
    variables: { applicationId, formId },
  })
  const views = application?.form.views

  // Auto navigate to new view tab
  useEffect(() => {
    const newViewId = newViewData?.createView.id
    if (newViewId && views?.some(i => i.id === newViewId)) {
      if (viewId) {
        navigate(`../${newViewId}`)
      } else {
        navigate(newViewId)
      }
      resetNewViewData()
    }
  }, [newViewData, views, viewId])

  useEffect(() => {
    // Auto redirect to parent route when views is empty
    if (viewId && views?.length === 0) {
      navigate('..', { replace: true })
    }
    // Auto redirect to first view tab
    else if (!viewId && views?.length) {
      const first = views.at(0)!.id
      navigate(first, { replace: true })
    }
    // Auto redirect to first view tab when current viewId is not exist in view list
    else if (views?.length && !views.some(v => v.id === viewId)) {
      const first = views.at(0)!.id
      navigate(`../${first}`, { replace: true })
    }
  }, [viewId, views])

  const handleDetail = useCallback((viewId: string) => {
    navigate(`../${viewId}`)
  }, [])

  const handleCreate = useCallback(() => {
    if (!application) {
      return
    }

    createView({
      variables: {
        applicationId: application.id,
        formId: application.form.id,
        input: {
          fields:
            application.form.layout?.rows.flatMap(row =>
              row.children.map(col => ({ fieldId: col.fieldId }))
            ) ?? [],
        },
      },
    })
  }, [application])

  const [recordCreatorVisible, toggleRecordCreatorVisible] = useToggle(false)

  if (!application) {
    return null
  }

  return (
    <>
      <RecordCreator
        application={application}
        visible={recordCreatorVisible}
        onCancel={toggleRecordCreatorVisible}
      />

      <Box px={2} py={1} sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography.Title level={5} style={{ margin: 0 }}>
          {application.form.name || '未命名'}
        </Typography.Title>
        <Box flex={1} />
        <Button
          type="primary"
          shape="round"
          icon={<PlusOutlined />}
          onClick={toggleRecordCreatorVisible}
        >
          记录
        </Button>
      </Box>

      <TabsContainer>
        <Box sx={{ mr: 1, ml: -1 }}>
          <Button type="link" icon={<PlusOutlined />} onClick={handleCreate} />
        </Box>

        <ViewTabs application={application} value={viewId} onChange={handleDetail} />
      </TabsContainer>
    </>
  )
}

const TabsContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid #efefef;
`

function ViewTabs({
  application,
  value,
  onChange,
}: {
  application: Application
  value?: string
  onChange?: (viewId: string) => void
}) {
  const navigate = useNavigate()
  const [deleteView] = useDeleteView()

  const handleClick = useCallback(
    (view: View) => {
      onChange?.(view.id)
    },
    [onChange]
  )

  const handleDelete = useCallback(
    (view: { id: string }) => {
      const index = application?.form.views?.findIndex(i => i.id === view.id)
      const next =
        index !== undefined
          ? application.form.views?.at(index + 1) ??
            application.form.views?.at(index - 1) ??
            application.form.views?.at(-1)
          : undefined

      deleteView({
        variables: { applicationId: application.id, formId: application.form.id, viewId: view.id },
      })
        .then(() => {
          if (next) {
            navigate(`../${next.id}`, { replace: true })
          } else {
            navigate(`..`, { replace: true })
          }
          message.success('删除成功')
        })
        .catch(error => {
          message.error(error.message)
          throw error
        })
    },
    [application]
  )

  return (
    <_ViewTabs>
      {application.form.views?.map(view => (
        <ViewTabs.Item
          key={view.id}
          selected={value === view.id}
          applicationId={application.id}
          formId={application.form.id}
          view={view}
          onClick={handleClick}
          onDelete={handleDelete}
        />
      ))}
    </_ViewTabs>
  )
}

const _ViewTabs = styled.div`
  display: flex;
`

ViewTabs.Item = (props: {
  selected?: boolean
  applicationId: string
  formId: string
  view: View
  onClick?: (view: View) => void
  onDelete?: (view: View) => void
}) => {
  const [updateView] = useUpdateView()

  const [nameUpdaterProps, setNameUpdaterProps] = useState<PoppromptProps>()

  const handleToggleNameUpdater = useCallback(() => {
    setNameUpdaterProps({
      value: props.view.name,
      visible: true,
      onSubmit: name => {
        updateView({
          variables: {
            applicationId: props.applicationId,
            formId: props.formId,
            viewId: props.view.id,
            input: { name },
          },
        })
          .then(() => setNameUpdaterProps(undefined))
          .catch(error => {
            setNameUpdaterProps(props => ({ ...props, error }))
            throw error
          })
      },
      onVisibleChange: () => setNameUpdaterProps(undefined),
    })
  }, [props.view])

  const handleClick = useCallback(() => {
    props.onClick?.(props.view)
  }, [props.view, props.onClick])

  const handleDelete = useCallback(() => {
    props.onDelete?.(props.view)
  }, [props.view, props.onDelete])

  return (
    <_ViewTabsItem className={cx(props.selected && 'selected')} onClick={handleClick}>
      <Popprompt {...nameUpdaterProps}>
        <span>{props.view.name || '未命名'}</span>
      </Popprompt>

      {props.selected && (
        <span onClick={e => e.stopPropagation()}>
          <Dropdown
            arrow
            trigger={['click']}
            placement="bottomCenter"
            overlay={() => (
              <Menu>
                <Menu.Item key="rename" icon={<EditOutlined />} onClick={handleToggleNameUpdater}>
                  重命名
                </Menu.Item>
                <Menu.Item key="delete" icon={<DeleteOutlined />} onClick={handleDelete}>
                  删除
                </Menu.Item>
              </Menu>
            )}
          >
            <CaretDownOutlined />
          </Dropdown>
        </span>
      )}
    </_ViewTabsItem>
  )
}

const _ViewTabsItem = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 16px;
  font-weight: bold;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  &.selected {
    color: var(--ant-primary-color-active);

    &:after {
      content: '';
      display: block;
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 2px;
      background-color: var(--ant-primary-color-active);
      opacity: 0.8;
    }
  }

  .anticon {
    margin-left: 4px;
    color: rgba(0, 0, 0, 0.3);
  }
`
