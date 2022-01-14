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

import { gql, MutationHookOptions, QueryHookOptions, useMutation, useQuery } from '@apollo/client'
import styled from '@emotion/styled'
import { Add, DeleteForever, Edit, MoreVert, ViewList } from '@mui/icons-material'
import {
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
} from '@mui/material'
import { useSnackbar } from 'notistack'
import { useState } from 'react'
import { Route, Routes, useNavigate, useParams } from 'react-router-dom'
import ArrowMenu from '../../components/ArrowMenu'
import AsideLayout from '../../components/Layout/AsideLayout'
import NetworkIndicator from '../../components/NetworkIndicator'
import { NotFoundViewLazy } from '../error'

export default function ApplicationView() {
  const { applicationId } = useParams<{ applicationId: string }>()
  if (!applicationId) {
    throw new Error(`Required params applicationId is missing`)
  }

  const navigate = useNavigate()
  const snackbar = useSnackbar()
  const [deleteForm] = useMutation<
    { deleteForm: boolean },
    { applicationId: string; formId: string }
  >(
    gql`
      mutation DeleteForm($applicationId: String!, $formId: String!) {
        deleteForm(applicationId: $applicationId, formId: $formId)
      }
    `,
    { refetchQueries: ['ApplicationForms'] }
  )
  const [anchorEl, setAnchorEl] = useState<{ anchorEl: Element; form: Form }>()

  const handleMenuOpen = (e: React.MouseEvent<HTMLButtonElement>, form: Form) => {
    e.preventDefault()
    e.stopPropagation()
    setAnchorEl({ anchorEl: e.currentTarget, form })
  }

  const handleMenuClose = () => {
    setAnchorEl(undefined)
  }

  const handleDelete = () => {
    const form = anchorEl?.form
    handleMenuClose()
    if (app && form) {
      deleteForm({ variables: { applicationId: app.id, formId: form.id } })
        .then(() => snackbar.enqueueSnackbar('删除成功', { variant: 'success' }))
        .catch(error => snackbar.enqueueSnackbar(error.message, { variant: 'error' }))
    }
  }

  const handleToEdit = () => {
    const form = anchorEl?.form
    handleMenuClose()
    if (app && form) {
      navigate(`/application/${app.id}/form/${form.id}/edit`)
    }
  }

  const application = useApplication({ variables: { id: applicationId } })

  const [createForm] = useCreateForm()

  const app = application.data?.application

  return (
    <>
      <NetworkIndicator in={application.loading} />

      {app && (
        <AsideLayout
          sx={{ paddingTop: 7 }}
          left={
            <>
              <_List>
                {app.forms.map(form => (
                  <ListItemButton
                    key={form.id}
                    onClick={() => navigate(`/application/${app.id}/form/${form.id}`)}
                  >
                    <ListItemIcon>
                      <ViewList />
                    </ListItemIcon>

                    <ListItemText
                      primaryTypographyProps={{ noWrap: true }}
                      primary={form.name || '未命名'}
                    />

                    <IconButton
                      className="hover_visible"
                      sx={{ width: 32, height: 32 }}
                      onClick={e => handleMenuOpen(e, form)}
                    >
                      <MoreVert />
                    </IconButton>
                  </ListItemButton>
                ))}
                <ListItemButton
                  key="add"
                  onClick={() => createForm({ variables: { applicationId: app.id, input: {} } })}
                >
                  <ListItemIcon>
                    <Add />
                  </ListItemIcon>
                  <ListItemText>新建表单</ListItemText>
                </ListItemButton>
              </_List>

              <ArrowMenu
                anchorEl={anchorEl?.anchorEl}
                open={Boolean(anchorEl)}
                keepMounted
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={handleToEdit}>
                  <ListItemIcon>
                    <Edit />
                  </ListItemIcon>

                  <ListItemText>编辑表单</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleDelete}>
                  <ListItemIcon>
                    <DeleteForever />
                  </ListItemIcon>

                  <ListItemText>删除</ListItemText>
                </MenuItem>
              </ArrowMenu>
            </>
          }
        >
          <ApplicationRoutes />
        </AsideLayout>
      )}
    </>
  )
}

const ApplicationRoutes = () => {
  return (
    <Routes>
      <Route index element={<div />} />
      <Route path="form/:formId" element={<div />} />
      <Route path="*" element={<NotFoundViewLazy />} />
    </Routes>
  )
}

interface Application {
  id: string
  createdAt: number
  updatedAt?: number
  name?: string

  forms: Form[]
}

interface Form {
  id: string
  createdAt: number
  updated?: number
  name?: string
  description?: string
}

const useApplication = (options?: QueryHookOptions<{ application: Application }, { id: string }>) =>
  useQuery(
    gql`
      query ApplicationForms($id: String!) {
        application(id: $id) {
          id
          createdAt
          updatedAt
          name

          forms {
            id
            createdAt
            updatedAt
            name
            description
          }
        }
      }
    `,
    options
  )

const useCreateForm = (
  options?: MutationHookOptions<
    { createForm: Form },
    { applicationId: string; input: { name?: string; description?: string } }
  >
) =>
  useMutation(
    gql`
      mutation CreateForm($applicationId: String!, $input: CreateFormInput!) {
        createForm(applicationId: $applicationId, input: $input) {
          id
          createdAt
          updatedAt
          name
          description
        }
      }
    `,
    { ...options, refetchQueries: ['ApplicationForms'] }
  )

const _List = styled(List)`
  .MuiListItemIcon-root {
    min-width: ${props => props.theme.spacing(4)};
  }

  > .MuiListItemButton-root {
    .hover_visible {
      margin-right: -8px;
      display: none;
    }

    &:hover {
      .hover_visible {
        display: flex;
      }
    }
  }
`
