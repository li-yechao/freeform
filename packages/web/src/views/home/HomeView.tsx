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

import {
  AppstoreOutlined,
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import styled from '@emotion/styled'
import { Box } from '@mui/system'
import { Button, Col, Dropdown, Menu, message, Row, Typography } from 'antd'
import { useCallback, useState } from 'react'
import { FormattedDate } from 'react-intl'
import { useNavigate } from 'react-router-dom'
import Popprompt, { PoppromptProps } from '../../components/Modal/Popprompt'
import {
  Application,
  useApplications,
  useCreateApplication,
  useDeleteApplication,
  useUpdateApplication,
} from './graphql'

export default function HomeView() {
  const { data: { applications } = {} } = useApplications({ variables: { first: 100 } })

  return (
    <Box pb={10} sx={{ maxWidth: 800, margin: 'auto' }}>
      <Row gutter={16}>
        {applications?.nodes.map(app => (
          <Col key={app.id} xs={8}>
            <AppItem application={app} />
          </Col>
        ))}
        <Col key="add" xs={8}>
          <AppCreator />
        </Col>
      </Row>
    </Box>
  )
}

const AppItem = ({ application }: { application: Application }) => {
  const navigate = useNavigate()
  const [deleteApplication] = useDeleteApplication()
  const [updateApplication] = useUpdateApplication()

  const handleDelete = useCallback(() => {
    deleteApplication({ variables: { applicationId: application.id } })
      .then(() => message.success('删除成功'))
      .catch(error => {
        message.error(error.message)
        throw error
      })
  }, [application])

  const handleDetail = useCallback(() => {
    navigate(`/application/${application.id}`)
  }, [application])

  const [nameUpdaterProps, setNameUpdaterProps] = useState<PoppromptProps>()

  const handleToggleNameUpdater = useCallback(() => {
    setNameUpdaterProps({
      value: application.name,
      visible: true,
      onSubmit: name => {
        updateApplication({
          variables: {
            applicationId: application.id,
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
  }, [application])

  return (
    <_ItemContainer>
      <Box sx={{ display: 'flex', alignItems: 'center' }} onClick={handleDetail}>
        <Box sx={{ p: 2, color: '#eeeeee' }}>
          <AppstoreOutlined style={{ fontSize: 60 }} />
        </Box>

        <Box sx={{ flex: 1, overflow: 'hidden', pr: 2 }}>
          <Box>
            <Typography.Title level={5} ellipsis>
              <Popprompt {...nameUpdaterProps}>
                <span>{application.name || '未命名'}</span>
              </Popprompt>
            </Typography.Title>
          </Box>

          <Typography.Text ellipsis type="secondary">
            <FormattedDate
              value={application.updatedAt ?? application.createdAt}
              year="numeric"
              month="numeric"
              day="numeric"
              hour="numeric"
              hour12={false}
              minute="numeric"
            />
          </Typography.Text>
        </Box>
      </Box>

      <Dropdown
        className="hover_visible"
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
        <Button size="small" type="text" shape="circle">
          <MoreOutlined />
        </Button>
      </Dropdown>
    </_ItemContainer>
  )
}

const AppCreator = () => {
  const [createApplication] = useCreateApplication()

  const handleCreate = useCallback(() => {
    createApplication({ variables: { input: {} } })
      .then(() => message.success('创建成功'))
      .catch(error => {
        message.error(error.message)
        throw error
      })
  }, [])

  return (
    <_ItemContainer onClick={handleCreate}>
      <PlusOutlined />
    </_ItemContainer>
  )
}

const _ItemContainer = styled(Box)`
  position: relative;
  background-color: #ffffff;
  border-radius: 8px;
  cursor: pointer;
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 8px 0;
  border: 1px solid var(--ant-primary-color-outline);

  .hover_visible {
    display: none;
    position: absolute;
    top: 4px;
    right: 4px;

    &.ant-dropdown-open,
    &.visible {
      display: block;
    }
  }

  &:hover {
    border-color: var(--ant-primary-color-hover);

    .hover_visible {
      display: block;
    }
  }
`
