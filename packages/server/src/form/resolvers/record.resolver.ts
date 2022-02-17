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

import { UseGuards } from '@nestjs/common'
import {
  Args,
  Context,
  Field,
  Int,
  Mutation,
  ObjectType,
  Parent,
  ResolveField,
  Resolver,
} from '@nestjs/graphql'
import { AuthGuard } from '../../auth/auth.guard'
import { Viewer } from '../../auth/auth.schema'
import { CreateRecordInput, UpdateRecordInput } from '../inputs/record.input'
import { Form } from '../schemas/form.schema'
import { Record } from '../schemas/record.schema'
import { RecordService } from '../services/record.service'

@Resolver(() => Form)
@UseGuards(AuthGuard)
export class RecordResolver {
  constructor(private readonly recordService: RecordService) {}

  @ResolveField(() => RecordConnection)
  async records(
    @Context('viewer') viewer: Viewer,
    @Parent() form: Form,
    @Args('viewId') viewId: string,
    @Args({ type: () => Int, name: 'page' }) page: number,
    @Args({ type: () => Int, name: 'limit' }) limit: number
  ): Promise<RecordConnection> {
    return new RecordConnection(
      this.recordService,
      viewer,
      form.applicationId.toHexString(),
      form.id,
      viewId,
      page,
      limit
    )
  }

  @ResolveField(() => RecordConnectionByAssociationFormFieldSearch)
  async recordsByAssociationFormFieldSearch(
    @Context('viewer') viewer: Viewer,
    @Parent() form: Form,
    @Args('sourceFormId') sourceFormId: string,
    @Args('sourceFieldId') sourceFieldId: string,
    @Args({ type: () => Int, name: 'page' }) page: number,
    @Args({ type: () => Int, name: 'limit' }) limit: number,
    @Args({ type: () => [String], name: 'recordIds', nullable: true }) recordIds?: string[]
  ): Promise<RecordConnectionByAssociationFormFieldSearch> {
    return new RecordConnectionByAssociationFormFieldSearch({
      recordService: this.recordService,
      viewer,
      form,
      sourceFormId,
      sourceFieldId,
      page,
      limit,
      recordIds,
    })
  }

  @ResolveField(() => Record)
  async record(
    @Context('viewer') viewer: Viewer,
    @Parent() form: Form,
    @Args('viewId') viewId: string,
    @Args('recordId') recordId: string
  ): Promise<Record> {
    const record = await this.recordService.selectRecord({
      viewerId: viewer.id,
      applicationId: form.applicationId.toHexString(),
      formId: form.id,
      viewId,
      recordId,
    })
    if (!record) {
      throw new Error('Not found')
    }
    return record
  }

  @Mutation(() => Record)
  async createRecord(
    @Context('viewer') viewer: Viewer,
    @Args('applicationId') applicationId: string,
    @Args('formId') formId: string,
    @Args('input') input: CreateRecordInput
  ): Promise<Record> {
    return await this.recordService.createRecord({
      viewerId: viewer.id,
      applicationId,
      formId,
      input,
    })
  }

  @Mutation(() => Record)
  async updateRecord(
    @Context('viewer') viewer: Viewer,
    @Args('applicationId') applicationId: string,
    @Args('formId') formId: string,
    @Args('recordId') recordId: string,
    @Args('input') input: UpdateRecordInput
  ): Promise<Record> {
    const record = await this.recordService.updateRecord({
      viewerId: viewer.id,
      applicationId,
      formId,
      recordId,
      input,
    })
    if (!record) {
      throw new Error(`Not found`)
    }
    return record
  }

  @Mutation(() => Boolean)
  async deleteRecord(
    @Context('viewer') viewer: Viewer,
    @Args('applicationId') applicationId: string,
    @Args('formId') formId: string,
    @Args('recordId') recordId: string
  ): Promise<boolean> {
    const record = await this.recordService.deleteRecord({
      viewerId: viewer.id,
      applicationId,
      formId,
      recordId,
    })
    if (!record) {
      throw new Error(`Not found`)
    }
    return true
  }
}

@ObjectType()
export class RecordConnection {
  constructor(
    private readonly recordService: RecordService,
    private readonly viewer: Viewer,
    private readonly applicationId: string,
    private readonly formId: string,
    private readonly viewId: string,
    private readonly page: number,
    private readonly limit: number
  ) {}

  private _list?: Promise<Record[]>

  private get list() {
    if (!this._list) {
      this._list = this.recordService.selectRecords({
        viewerId: this.viewer.id,
        applicationId: this.applicationId,
        formId: this.formId,
        viewId: this.viewId,
        page: this.page,
        limit: this.limit,
      })
    }
    return this._list
  }

  @Field(() => [Record])
  get nodes() {
    return this.list
  }

  private __pageInfo?: PageInfo

  private get _pageInfo() {
    if (!this.__pageInfo) {
      this.__pageInfo = new PageInfo(() =>
        this.recordService.selectRecordCount({
          viewerId: this.viewer.id,
          applicationId: this.applicationId,
          formId: this.formId,
          viewId: this.viewId,
        })
      )
    }
    return this.__pageInfo
  }

  @Field(() => PageInfo)
  get pageInfo() {
    return this._pageInfo
  }
}

@ObjectType()
class PageInfo {
  constructor(private readonly __count: () => Promise<number>) {}

  private _count?: Promise<number>

  @Field(() => Int)
  get count(): Promise<number> {
    if (!this._count) {
      this._count = this.__count()
    }
    return this._count
  }
}

@ObjectType()
export class RecordConnectionByAssociationFormFieldSearch {
  constructor(
    private readonly options: {
      recordService: RecordService
      viewer: Viewer
      form: Form
      sourceFormId: string
      sourceFieldId: string
      page: number
      limit: number
      recordIds?: string[] | undefined
    }
  ) {}

  private _list?: Promise<Record[]>

  private get list() {
    if (!this._list) {
      this._list = this.options.recordService.selectRecordsByAssociationFormFieldSearch({
        viewerId: this.options.viewer.id,
        applicationId: this.options.form.applicationId.toHexString(),
        formId: this.options.form.id,
        sourceFormId: this.options.sourceFormId,
        sourceFieldId: this.options.sourceFieldId,
        page: this.options.page,
        limit: this.options.limit,
        recordIds: this.options.recordIds,
      })
    }
    return this._list
  }

  @Field(() => [Record])
  get nodes() {
    return this.list
  }

  private __pageInfo?: PageInfo

  private get _pageInfo() {
    if (!this.__pageInfo) {
      this.__pageInfo = new PageInfo(() =>
        this.options.recordIds?.length
          ? this.list.then(res => res.length)
          : this.options.recordService.selectRecordCountByAssociationFormFieldSearch({
              viewerId: this.options.viewer.id,
              applicationId: this.options.form.applicationId.toHexString(),
              formId: this.options.form.id,
            })
      )
    }
    return this.__pageInfo
  }

  @Field(() => PageInfo)
  get pageInfo() {
    return this._pageInfo
  }
}
