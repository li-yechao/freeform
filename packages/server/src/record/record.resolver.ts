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
import { AuthGuard } from '../auth/auth.guard'
import { Viewer } from '../auth/auth.schema'
import { Form } from '../form/form.schema'
import { CreateRecordInput, UpdateRecordInput } from './record.input'
import { Record } from './record.schema'
import { RecordService } from './record.service'

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
      form.application,
      form.id,
      viewId,
      page,
      limit
    )
  }

  @ResolveField(() => Record)
  async record(
    @Context('viewer') viewer: Viewer,
    @Parent() form: Form,
    @Args('viewId') viewId: string,
    @Args('recordId') recordId: string
  ): Promise<Record> {
    const record = await this.recordService.selectRecord(
      viewer.unionId,
      form.application,
      form.id,
      viewId,
      recordId
    )
    if (!record) {
      throw new Error('Not found')
    }
    return record
  }

  @Mutation(() => Record)
  async createRecord(
    @Context('viewer') viewer: Viewer,
    @Args('applicationId') appId: string,
    @Args('formId') formId: string,
    @Args('input') input: CreateRecordInput
  ): Promise<Record> {
    return await this.recordService.createRecord(viewer.unionId, appId, formId, input)
  }

  @Mutation(() => Record)
  async updateRecord(
    @Context('viewer') viewer: Viewer,
    @Args('applicationId') appId: string,
    @Args('formId') formId: string,
    @Args('recordId') recordId: string,
    @Args('input') input: UpdateRecordInput
  ): Promise<Record> {
    const record = await this.recordService.updateRecord(
      viewer.unionId,
      appId,
      formId,
      recordId,
      input
    )
    if (!record) {
      throw new Error(`Not found`)
    }
    return record
  }

  @Mutation(() => Boolean)
  async deleteRecord(
    @Context('viewer') viewer: Viewer,
    @Args('applicationId') appId: string,
    @Args('formId') formId: string,
    @Args('recordId') recordId: string
  ): Promise<boolean> {
    const record = await this.recordService.deleteRecord(viewer.unionId, appId, formId, recordId)
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
    private readonly appId: string,
    private readonly formId: string,
    private readonly viewId: string,
    private readonly page: number,
    private readonly limit: number
  ) {}

  private _list?: Promise<Record[]>

  private get list() {
    if (!this._list) {
      this._list = this.recordService.selectRecords(
        this.viewer.unionId,
        this.appId,
        this.formId,
        this.viewId,
        this.page,
        this.limit
      )
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
        this.recordService.selectRecordCount(
          this.viewer.unionId,
          this.appId,
          this.formId,
          this.viewId
        )
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
