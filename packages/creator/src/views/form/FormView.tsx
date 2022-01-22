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

import { gql, QueryHookOptions, useMutation, useQuery } from '@apollo/client'
import styled from '@emotion/styled'
import { Add, ArrowDropDown, DeleteForever, Title } from '@mui/icons-material'
import {
  Box,
  IconButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import { useSnackbar } from 'notistack'
import { ComponentProps, useCallback, useEffect, useState } from 'react'
import { Route, Routes, useNavigate, useParams } from 'react-router-dom'
import ArrowMenu from '../../components/ArrowMenu'
import Prompt from '../../components/Modal/Prompt'
import NetworkIndicator from '../../components/NetworkIndicator'

export default function FormView() {
  const { applicationId, formId } = useParams<{ applicationId: string; formId: string }>()
  if (!applicationId || !formId) {
    throw new Error(`Required params applicationId or formId is missing`)
  }

  const {
    data: { application } = {},
    loading,
    error,
  } = useApplicationFormViews({ variables: { applicationId, formId } })
  if (error) {
    throw error
  }

  return (
    <>
      <NetworkIndicator in={loading} />

      {application && (
        <_FormView>
          <Routes>
            <Route index element={<FormHeader app={application} />} />
            <Route path=":viewId" element={<FormHeader app={application} />} />
          </Routes>

          <Routes>
            <Route index element={<RedirectToFirstView app={application} />} />
          </Routes>
        </_FormView>
      )}
    </>
  )
}

const RedirectToFirstView = ({ app }: { app: ApplicationForm }) => {
  const first = app.form.views?.at(0)
  const navigate = useNavigate()

  useEffect(() => {
    if (first) {
      navigate(first.id, { replace: true })
    }
  }, [first])

  return null
}

const _FormView = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: ${props => props.theme.palette.background.paper};
  border-left: 1px solid ${props => props.theme.palette.divider};
`

const FormHeader = ({ app }: { app: ApplicationForm }) => {
  const { viewId } = useParams<'viewId'>()
  const navigate = useNavigate()
  const snackbar = useSnackbar()

  const [anchorEl, setAnchorEl] =
    useState<{ anchorEl: Element; view: { id: string; name?: string } }>()

  const [deleteView] = useMutation(
    gql`
      mutation DeleteView($applicationId: String!, $formId: String!, $viewId: String!) {
        deleteView(applicationId: $applicationId, formId: $formId, viewId: $viewId)
      }
    `,
    { refetchQueries: ['ApplicationFormViews'] }
  )

  const handleMenuOpen = (
    e: React.MouseEvent<HTMLButtonElement>,
    view: { id: string; name?: string }
  ) => {
    e.preventDefault()
    e.stopPropagation()
    setAnchorEl({ anchorEl: e.currentTarget, view })
  }

  const handleMenuClose = () => {
    setAnchorEl(undefined)
  }

  const handleDelete = () => {
    const view = anchorEl?.view
    handleMenuClose()
    if (view) {
      const index = app.form.views?.findIndex(i => i.id === view.id)
      const next =
        index !== undefined
          ? app.form.views?.at(index + 1) ?? app.form.views?.at(index - 1) ?? app.form.views?.at(-1)
          : undefined

      deleteView({ variables: { applicationId: app.id, formId: app.form.id, viewId: view.id } })
        .then(() => {
          if (next) {
            navigate(`../${next.id}`)
          } else {
            navigate(`..`)
          }
          snackbar.enqueueSnackbar('删除成功', { variant: 'success' })
        })
        .catch(error => snackbar.enqueueSnackbar(error.message, { variant: 'error' }))
    }
  }

  const [nameUpdaterProps, setNameUpdaterProps] = useState<
    Partial<ComponentProps<typeof ViewNameUpdater>> | undefined
  >()

  const handleEditName = () => {
    const view = anchorEl?.view
    handleMenuClose()
    if (view) {
      setNameUpdaterProps({
        open: true,
        anchorEl: document.getElementById(`view-name-${view.id}`),
        app: { id: app.id, form: { id: app.form.id, view: { id: view.id, name: view.name } } },
        onClose: () => {
          setNameUpdaterProps(undefined)
        },
      })
    }
  }

  return (
    <>
      <Box px={2} py={1}>
        <Typography variant="subtitle1">{app.form.name || '未命名'}</Typography>
      </Box>

      <Box px={2} sx={{ display: 'flex', alignItems: 'center' }}>
        <ViewCreator app={app} />

        <Tabs
          variant="scrollable"
          scrollButtons="auto"
          sx={{ minHeight: 32 }}
          value={viewId}
          onChange={(_, viewId) => navigate(`../${viewId}`, { replace: true })}
        >
          {app.form.views?.map(view => (
            <Tab
              key={view.id}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography>
                    <span id={`view-name-${view.id}`}>{view.name || '未命名'}</span>
                  </Typography>

                  {viewId === view.id && (
                    <IconButton
                      component="span"
                      disableRipple
                      sx={{ width: 20, height: 20 }}
                      onClick={(e: any) => handleMenuOpen(e, view)}
                    >
                      <ArrowDropDown />
                    </IconButton>
                  )}
                </Box>
              }
              value={view.id}
              sx={{ minHeight: 32, paddingY: 1 }}
            />
          ))}
        </Tabs>

        <ArrowMenu
          anchorEl={anchorEl?.anchorEl}
          open={Boolean(anchorEl)}
          keepMounted
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleEditName}>
            <ListItemIcon>
              <Title />
            </ListItemIcon>

            <ListItemText>重命名</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleDelete}>
            <ListItemIcon>
              <DeleteForever />
            </ListItemIcon>

            <ListItemText>删除</ListItemText>
          </MenuItem>
        </ArrowMenu>

        <ViewNameUpdater {...nameUpdaterProps} />
      </Box>
    </>
  )
}

interface ApplicationForm {
  id: string
  createdAt: number
  updatedAt?: number
  name?: string

  form: {
    id: string
    createdAt: number
    updatedAt?: number
    name?: string
    description?: string

    fields?: {
      id: string
      type: string
      name?: string
      label: string
      meta?: { [key: string]: any }
    }[]

    layout?: {
      rows: {
        children: {
          fieldId: string
        }[]
      }[]
    }

    views?: {
      id: string
      name?: string
      fields?: { fieldId: string }[]
    }[]
  }
}

const useApplicationFormViews = (
  options?: QueryHookOptions<
    { application: ApplicationForm },
    { applicationId: string; formId: string }
  >
) =>
  useQuery(
    gql`
      query ApplicationFormViews($applicationId: String!, $formId: String!) {
        application(id: $applicationId) {
          id
          createdAt
          updatedAt
          name

          form(formId: $formId) {
            id
            createdAt
            updatedAt
            name
            description

            fields {
              id
              type
              name
              label
              state
              meta
            }

            layout {
              rows {
                children {
                  fieldId
                }
              }
            }

            views {
              id
              name
              fields {
                fieldId
              }
            }
          }
        }
      }
    `,
    options
  )

const ViewCreator = ({ app }: { app: ApplicationForm }) => {
  const snackbar = useSnackbar()

  const [createForm, { loading, error }] = useMutation<
    { createView: { id: string; name?: string; fields?: { fieldId: string }[] } },
    {
      applicationId: string
      formId: string
      input: { name?: string; fields: { fieldId: string }[] }
    }
  >(
    gql`
      mutation CreateView($applicationId: String!, $formId: String!, $input: ViewInput!) {
        createView(applicationId: $applicationId, formId: $formId, input: $input) {
          id
          name
          fields {
            fieldId
          }
        }
      }
    `,
    { refetchQueries: ['ApplicationFormViews'] }
  )

  const handleClick = () => {
    if (!loading) {
      createForm({
        variables: {
          applicationId: app.id,
          formId: app.form.id,
          input: {
            fields:
              app.form.layout?.rows.flatMap(row =>
                row.children.map(col => ({ fieldId: col.fieldId }))
              ) ?? [],
          },
        },
      })
    }
  }

  useEffect(() => {
    if (error) {
      snackbar.enqueueSnackbar(error.message, { variant: 'error' })
    }
  }, [error])

  return (
    <IconButton onClick={handleClick}>
      <Add />
    </IconButton>
  )
}

const ViewNameUpdater = ({
  open = false,
  app,
  anchorEl,
  onClose,
}: {
  open?: boolean
  app?: { id: string; form: { id: string; view: { id: string; name?: string } } } | null
  anchorEl?: Element | null
  onClose?: () => void | null
}) => {
  const [updateView, { data, loading, error, reset }] = useMutation<
    { updateView: { id: string; name?: string } },
    { applicationId: string; formId: string; viewId: string; input: { name: string } }
  >(gql`
    mutation UpdateView(
      $applicationId: String!
      $formId: String!
      $viewId: String!
      $input: ViewInput!
    ) {
      updateView(applicationId: $applicationId, formId: $formId, viewId: $viewId, input: $input) {
        id
        name
      }
    }
  `)

  const updateName = useCallback(
    (name: string) => {
      if (!app || loading) {
        return
      }
      updateView({
        variables: {
          applicationId: app.id,
          formId: app.form.id,
          viewId: app.form.view.id,
          input: { name },
        },
      })
    },
    [app?.form.view.id, updateView, loading]
  )

  useEffect(() => {
    if (data?.updateView.id) {
      onClose?.()
      reset()
    }
  }, [data, onClose])

  return (
    <Prompt
      open={open}
      anchorEl={anchorEl}
      value={app?.form.view.name}
      error={error}
      onClose={onClose}
      onSubmit={updateName}
    />
  )
}
