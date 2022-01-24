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
import { gql, useMutation, useQuery } from '@apollo/client'
import styled from '@emotion/styled'
import { Box } from '@mui/system'
import { Button, Col, Dropdown, Menu, message, Row, Typography } from 'antd'
import { useCallback } from 'react'
import { FormattedDate } from 'react-intl'
import { useNavigate } from 'react-router-dom'
import { useToggle } from 'react-use'
import Popprompt, { PoppromptProps } from '../../components/Modal/Popprompt'

export default function HomeView() {
  const apps = useApps()

  return (
    <Box pb={10} sx={{ maxWidth: 800, margin: 'auto' }}>
      <Row gutter={16}>
        {apps.data?.applications.map(app => (
          <Col key={app.id} xs={8}>
            <AppItem app={app} />
          </Col>
        ))}
        <Col key="add" xs={8}>
          <AddApp />
        </Col>
      </Row>
    </Box>
  )
}

interface Application {
  id: string
  createdAt: number
  updatedAt?: number
  name?: string
}

const useApps = () =>
  useQuery<{ applications: Application[] }>(gql`
    query Applications {
      applications {
        id
        createdAt
        updatedAt
        name
      }
    }
  `)

const AppItem = ({ app }: { app: Application }) => {
  const navigate = useNavigate()
  const [deleteApp] = useMutation<{ deleteApplication: boolean }, { applicationId: string }>(
    gql`
      mutation DeleteApplication($applicationId: String!) {
        deleteApplication(applicationId: $applicationId)
      }
    `,
    { refetchQueries: ['Applications'] }
  )

  const handleDelete = () => {
    deleteApp({ variables: { applicationId: app.id } })
      .then(() => message.success('删除成功'))
      .catch(error => message.error(error.message))
  }

  const handleToDetail = () => {
    navigate(`/application/${app.id}`)
  }

  const [nameUpdaterVisible, toggleNameUpdaterVisible] = useToggle(false)

  return (
    <_ItemContainer>
      <Box sx={{ display: 'flex', alignItems: 'center' }} onClick={handleToDetail}>
        <Box sx={{ p: 2, color: '#eeeeee' }}>
          <AppstoreOutlined style={{ fontSize: 60 }} />
        </Box>

        <Box sx={{ flex: 1, overflow: 'hidden', pr: 2 }}>
          <Box>
            <Typography.Title level={5} ellipsis>
              <AppNameUpdater
                app={app}
                visible={nameUpdaterVisible}
                onVisibleChange={toggleNameUpdaterVisible}
              >
                <span>{app.name || '未命名'}</span>
              </AppNameUpdater>
            </Typography.Title>
          </Box>

          <Typography.Text ellipsis type="secondary">
            <FormattedDate
              value={app.updatedAt ?? app.createdAt}
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
            <Menu.Item key="rename" icon={<EditOutlined />} onClick={toggleNameUpdaterVisible}>
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

const AppNameUpdater = ({
  app,
  ...props
}: {
  app: { id: string; name?: string }
} & PoppromptProps) => {
  const [updateApp, { loading, error }] = useMutation<
    { updateApplication: { id: string; updatedAt?: number; name?: string } },
    { applicationId: string; input: { name: string } }
  >(gql`
    mutation UpdateApplication($applicationId: String!, $input: UpdateApplicationInput!) {
      updateApplication(applicationId: $applicationId, input: $input) {
        id
        updatedAt
        name
      }
    }
  `)

  const updateName = useCallback(
    (name: string) => {
      if (loading) {
        return
      }
      updateApp({ variables: { applicationId: app.id, input: { name } } }).then(() =>
        props.onVisibleChange?.(false)
      )
    },
    [app.id]
  )

  return <Popprompt {...props} error={error} value={app.name} onSubmit={updateName} />
}

const AddApp = () => {
  const [createApplication] = useMutation<
    { createApplication: { id: string; createdAt: number; updated?: number; name?: string } },
    { input: { name?: string } }
  >(
    gql`
      mutation CreateApplication($input: CreateApplicationInput!) {
        createApplication(input: $input) {
          id
          createdAt
          updatedAt
          name
        }
      }
    `,
    { refetchQueries: ['Applications'] }
  )

  return (
    <_ItemContainer onClick={() => createApplication({ variables: { input: {} } })}>
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
