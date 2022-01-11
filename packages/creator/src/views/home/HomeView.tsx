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

import { gql, useMutation, useQuery } from '@apollo/client'
import { Add, DeleteForever, Image, MoreVert } from '@mui/icons-material'
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Grid,
  IconButton,
  ListItemIcon,
  MenuItem,
  Typography,
} from '@mui/material'
import { useSnackbar } from 'notistack'
import { useState } from 'react'
import { FormattedDate } from 'react-intl'
import { useNavigate } from 'react-router-dom'
import ArrowMenu from '../../components/ArrowMenu'

export default function HomeView() {
  const apps = useApps()

  return (
    <Box pb={10}>
      <Grid container spacing={2} maxWidth={800} margin="auto">
        {apps.data?.applications.map(app => (
          <Grid key={app.id} item xs={4}>
            <AppItem app={app} />
          </Grid>
        ))}
        <Grid key="add" item xs={4}>
          <AddApp />
        </Grid>
      </Grid>
    </Box>
  )
}

interface Application {
  id: string
  createdAt: number
  updated?: number
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
  const snackbar = useSnackbar()
  const navigate = useNavigate()
  const [deleteApp] = useMutation<{ deleteApplication: boolean }, { id: string }>(
    gql`
      mutation DeleteApplication($id: String!) {
        deleteApplication(id: $id)
      }
    `,
    { refetchQueries: ['Applications'] }
  )
  const [anchorEl, setAnchorEl] = useState<Element>()

  const handleMenuOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setAnchorEl(e.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(undefined)
  }

  const handleDelete = () => {
    handleMenuClose()
    deleteApp({ variables: { id: app.id } })
      .then(() => snackbar.enqueueSnackbar('删除成功', { variant: 'success' }))
      .catch(error => snackbar.enqueueSnackbar(error.message, { variant: 'error' }))
  }

  const handleToDetail = () => {
    navigate(`/application/${app.id}`)
  }

  return (
    <Card sx={{ position: 'relative' }}>
      <CardActionArea sx={{ display: 'flex' }} onClick={handleToDetail}>
        <CardMedia sx={{ fontSize: 120, lineHeight: 1 }}>
          <Image fontSize="inherit" sx={{ display: 'block', color: 'text.disabled' }} />
        </CardMedia>

        <CardContent sx={{ overflow: 'hidden' }}>
          <Typography variant="h5">{app.name || '未命名'}</Typography>

          <Typography variant="caption">
            <FormattedDate
              value={app.updated ?? app.createdAt}
              year="numeric"
              month="numeric"
              day="numeric"
              hour="numeric"
              hour12={false}
              minute="numeric"
            />
          </Typography>
        </CardContent>
      </CardActionArea>

      <IconButton
        size="small"
        sx={{ position: 'absolute', right: 4, top: 4 }}
        onClick={handleMenuOpen}
      >
        <MoreVert />
      </IconButton>

      <ArrowMenu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        keepMounted
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <DeleteForever />
          </ListItemIcon>
          Delete
        </MenuItem>
      </ArrowMenu>
    </Card>
  )
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
    <Card onClick={() => createApplication({ variables: { input: {} } })}>
      <CardActionArea>
        <CardMedia
          sx={{
            minHeight: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Add sx={{ display: 'block', color: 'text.disabled', fontSize: 40 }} />
        </CardMedia>
      </CardActionArea>
    </Card>
  )
}
