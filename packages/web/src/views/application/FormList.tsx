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

import { MoreOutlined, PlusOutlined, UnorderedListOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { Button, Dropdown, Menu, message } from 'antd'
import { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Popprompt, { PoppromptProps } from '../../components/Modal/Popprompt'
import { Form, useApplication, useCreateForm, useDeleteForm, useUpdateForm } from './graphql'

export default function FormList() {
  const { applicationId, formId } = useParams<'applicationId' | 'formId'>()
  if (!applicationId) {
    throw new Error('Required parameter applicationId is missing')
  }

  const navigate = useNavigate()

  const { data: { application } = {} } = useApplication({ variables: { applicationId } })
  const [createForm] = useCreateForm()
  const [deleteForm] = useDeleteForm()
  const [updateForm] = useUpdateForm()

  const [nameUpdaterProps, setNameUpdaterProps] = useState<PoppromptProps & { id?: string }>()

  const handleToggleNameUpdater = useCallback(
    (form: Form) => {
      setNameUpdaterProps({
        id: form.id,
        value: form.name,
        visible: true,
        onSubmit: name => {
          updateForm({
            variables: {
              applicationId,
              formId: form.id,
              input: { name },
            },
          })
            .then(() => {
              // Close popprompt
              setNameUpdaterProps(props => (props?.id === form.id ? undefined : props))
            })
            .catch(error => {
              // Set error props
              setNameUpdaterProps(props => (props?.id === form.id ? { ...props, error } : props))
              throw error
            })
        },
        onVisibleChange: () => setNameUpdaterProps(undefined),
      })
    },
    [applicationId]
  )

  const handleDetail = useCallback(
    (formId: string) => navigate(`/application/${applicationId}/${formId}`),
    [applicationId]
  )

  const handleDelete = useCallback(
    (formId: string) => {
      deleteForm({ variables: { applicationId, formId } })
        .then(() => {
          message.success('删除成功')
        })
        .catch(error => {
          message.error(error.message)
          throw error
        })
    },
    [applicationId]
  )

  const handleCreate = useCallback(() => {
    createForm({ variables: { applicationId, input: {} } })
  }, [applicationId])

  const handleToEdit = (form: { id: string }) => {
    navigate(`/application/${applicationId}/${form.id}/edit`)
  }

  return (
    <_Menu activeKey={formId} selectedKeys={formId ? [formId] : undefined}>
      {application?.forms.nodes.map(form => (
        <Menu.Item
          key={form.id}
          icon={<UnorderedListOutlined />}
          onClick={() => handleDetail(form.id)}
        >
          <span>
            <Popprompt {...(nameUpdaterProps?.id === form.id ? nameUpdaterProps : null)}>
              <span>{form.name || '未命名'}</span>
            </Popprompt>
          </span>

          <div className="hover_visible" onClick={e => e.stopPropagation()}>
            <Dropdown
              arrow
              trigger={['click']}
              overlay={() => (
                <Menu>
                  <Menu.Item key="rename" onClick={() => handleToggleNameUpdater(form)}>
                    重命名
                  </Menu.Item>
                  <Menu.Item key="edit" onClick={() => handleToEdit(form)}>
                    编辑表单
                  </Menu.Item>
                  <Menu.Item key="delete" onClick={() => handleDelete(form.id)}>
                    删除
                  </Menu.Item>
                </Menu>
              )}
            >
              <Button size="small" type="text" shape="circle">
                <MoreOutlined />
              </Button>
            </Dropdown>
          </div>
        </Menu.Item>
      ))}
      <Menu.Item key="add" icon={<PlusOutlined />} onClick={handleCreate}>
        新建表单
      </Menu.Item>
    </_Menu>
  )
}

const _Menu = styled(Menu)`
  border-right: 0;

  > .ant-menu-item {
    display: flex;
    align-items: center;
    margin-bottom: 0 !important;
    margin: 0;

    > .ant-menu-title-content {
      flex: 1;
      overflow: hidden;
      white-space: nowrap;
      display: flex;
      align-items: center;

      > span {
        flex: 1;
        overflow: hidden;
      }

      > .hover_visible {
        > .ant-dropdown-trigger {
          display: none;
        }

        > .ant-dropdown-open {
          display: block;
        }
      }
    }

    &:hover {
      .hover_visible {
        .ant-dropdown-trigger {
          display: block;
        }
      }
    }
  }
`
