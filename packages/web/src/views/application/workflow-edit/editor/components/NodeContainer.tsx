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

import { CaretDownOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { Button, Popover } from 'antd'
import { MouseEvent, ReactNode } from 'react'
import { useToggle } from 'react-use'
import { cx } from '../../../../../utils/cx'

export interface NodeContainerProps {
  id?: string
  children?: ReactNode
  plusContent?: ReactNode | (() => ReactNode)
  selected?: boolean
  onDelete?: () => void
  onClick?: (e: MouseEvent) => void
}

export default function NodeContainer(props: NodeContainerProps) {
  const [visible, toggleVisible] = useToggle(false)

  return (
    <_Container>
      <_Content
        tabIndex={-2}
        id={props.id}
        className={cx(props.selected && 'selected')}
        onClick={props.onClick}
      >
        {props.children}

        <_Actions className="hover_visible">
          {props.onDelete && (
            <Button type="primary" icon={<DeleteOutlined />} onClick={props.onDelete} />
          )}
        </_Actions>
      </_Content>
      <_Handler>
        <div onClick={toggleVisible}>
          {props.plusContent && (
            <Popover
              visible={visible}
              placement="rightTop"
              content={props.plusContent}
              onVisibleChange={toggleVisible}
            >
              <div className="handler">
                <PlusOutlined />
              </div>
            </Popover>
          )}
        </div>
        <CaretDownOutlined className="caret-down" />
      </_Handler>
    </_Container>
  )
}

const _Container = styled.div`
  position: relative;

  :hover {
    .handler {
      transform: scale(0.3);

      svg {
        display: none;
      }
    }
  }
`

const _Content = styled.div`
  background-color: #ffffff;
  box-shadow: 0 1px 4px 0 rgb(10 30 65 / 16%);
  padding: 5px 10px 8px;
  border-radius: 8px;
  width: 200px;
  cursor: pointer;

  .hover_visible {
    display: none;
  }

  &:hover {
    .hover_visible {
      display: block;
    }
  }

  &:focus {
    outline: 2px solid var(--ant-primary-color);
  }

  &.selected {
    outline: 2px solid var(--ant-primary-color);
  }
`

const _Handler = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 64px;
  position: relative;

  &:before {
    content: '';
    display: block;
    width: 2px;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 10px;
    margin: auto;
    z-index: -1;
    background-color: #dedede;
  }

  .caret-down {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    margin: auto;
    color: #dedede;
    font-size: 20px;
  }

  .handler {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: var(--ant-primary-color);
    box-shadow: 0 2px 4px 0 rgb(0 0 0 / 10%);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 1;
    color: #ffffff;
    cursor: pointer;
    margin-top: -8px;
    transform: scale(0);
    transition: all 0.3s;

    &.ant-popover-open {
      transform: scale(1) !important;

      svg {
        display: block;
      }
    }
  }

  &:hover {
    .handler {
      transform: scale(1) !important;

      svg {
        display: block;
      }
    }
  }
`

const _Actions = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  right: 0;
  bottom: 100%;
  padding-right: 4px;
  text-align: right;

  > button {
    width: 16px;
    height: 16px;
    margin: 4px 2px;

    > * {
      font-size: 10px;
    }
  }
`
