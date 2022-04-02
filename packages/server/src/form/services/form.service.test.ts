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

import { getModelToken } from '@nestjs/mongoose'
import { Test } from '@nestjs/testing'
import { Model, mongo } from 'mongoose'
import { createMock, MockType } from '../../jest.utils'
import { Form } from '../schemas/form.schema'
import { FormService } from './form.service'

describe('FormService', () => {
  let formService: FormService
  let formModel: MockType<Model<Form>>

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      providers: [
        FormService,
        { provide: getModelToken(Form.name), useFactory: () => createMock() },
      ],
    }).compile()

    formService = moduleFixture.get(FormService)
    formModel = moduleFixture.get(getModelToken(Form.name))
  })

  test('should return form', async () => {
    const applicationId = new mongo.ObjectId().toHexString()
    const formId = new mongo.ObjectId().toHexString()

    formModel.findOne.mockReturnValue({ id: formId, applicationId })

    await expect(formService.findOne({ applicationId, formId })).resolves.toMatchObject({
      id: formId,
      applicationId,
    })

    expect(formModel.findOne.mock.calls.at(0)?.at(0)).toMatchObject({
      _id: formId,
      applicationId,
      deletedAt: null,
    })
  })

  test('should throw form not found exception', async () => {
    const applicationId = new mongo.ObjectId().toHexString()
    const formId = new mongo.ObjectId().toHexString()

    formModel.findOne.mockReturnValue(undefined)

    await expect(formService.findOne({ applicationId, formId })).rejects.toThrow(/not found/i)
  })

  test('should return form list', async () => {
    const applicationId = new mongo.ObjectId().toHexString()
    const formId = new mongo.ObjectId().toHexString()

    formModel.find.mockReturnValue([{ id: formId, applicationId }])

    await expect(formService.find({ applicationId })).resolves.toMatchObject([
      {
        id: formId,
        applicationId,
      },
    ])

    expect(formModel.find.mock.calls.at(0)?.at(0)).toMatchObject({
      applicationId,
      deletedAt: null,
    })
  })

  test('should return form count', async () => {
    const applicationId = new mongo.ObjectId().toHexString()

    formModel.countDocuments.mockReturnValue(10)

    await expect(formService.count({ applicationId })).resolves.toEqual(10)

    expect(formModel.countDocuments.mock.calls.at(0)?.at(0)).toMatchObject({
      applicationId,
      deletedAt: null,
    })
  })

  test('should return created form', async () => {
    const applicationId = new mongo.ObjectId().toHexString()
    const formId = new mongo.ObjectId().toHexString()

    formModel.create.mockReturnValue([{ id: formId, applicationId }])

    await expect(formService.create({ applicationId, input: {} })).resolves.toMatchObject([
      {
        id: formId,
        applicationId,
      },
    ])

    expect(formModel.create.mock.calls.at(0)?.at(0)).toMatchObject({
      applicationId,
      createdAt: expect.any(Number),
    })
  })

  test('should return updated form', async () => {
    const applicationId = new mongo.ObjectId().toHexString()
    const formId = new mongo.ObjectId().toHexString()

    formModel.findOneAndUpdate.mockReturnValue([{ id: formId, applicationId }])

    await expect(formService.update({ applicationId, formId, input: {} })).resolves.toMatchObject([
      {
        id: formId,
        applicationId,
      },
    ])

    expect(formModel.findOneAndUpdate.mock.calls.at(0)?.at(0)).toMatchObject({
      _id: formId,
      applicationId,
      deletedAt: null,
    })
    expect(formModel.findOneAndUpdate.mock.calls.at(0)?.at(1)).toMatchObject({
      $set: {
        updatedAt: expect.any(Number),
      },
    })
    expect(formModel.findOneAndUpdate.mock.calls.at(0)?.at(2)).toMatchObject({
      new: true,
    })
  })

  test('should throw not found error if updating form not exist', async () => {
    const applicationId = new mongo.ObjectId().toHexString()
    const formId = new mongo.ObjectId().toHexString()

    formModel.findOneAndUpdate.mockReturnValue(undefined)

    await expect(formService.update({ applicationId, formId, input: {} })).rejects.toThrow(
      /not found/i
    )
  })

  test('should return deleted form', async () => {
    const applicationId = new mongo.ObjectId().toHexString()
    const formId = new mongo.ObjectId().toHexString()

    formModel.findOneAndUpdate.mockReturnValue([{ id: formId, applicationId }])

    await expect(formService.delete({ applicationId, formId })).resolves.toMatchObject([
      {
        id: formId,
        applicationId,
      },
    ])

    expect(formModel.findOneAndUpdate.mock.calls.at(0)?.at(0)).toMatchObject({
      _id: formId,
      applicationId,
      deletedAt: null,
    })
    expect(formModel.findOneAndUpdate.mock.calls.at(0)?.at(1)).toMatchObject({
      $set: {
        deletedAt: expect.any(Number),
      },
    })
    expect(formModel.findOneAndUpdate.mock.calls.at(0)?.at(2)).toMatchObject({
      new: true,
    })
  })

  test('should throw not found error if deleting form not exist', async () => {
    const applicationId = new mongo.ObjectId().toHexString()
    const formId = new mongo.ObjectId().toHexString()

    formModel.findOneAndUpdate.mockReturnValue(undefined)

    await expect(formService.delete({ applicationId, formId })).rejects.toThrow(/not found/i)
  })

  test('should return created view', async () => {
    const applicationId = new mongo.ObjectId().toHexString()
    const formId = new mongo.ObjectId().toHexString()
    const viewId = new mongo.ObjectId().toHexString()

    formModel.findOneAndUpdate.mockReturnValue({
      id: formId,
      applicationId,
      views: [{ id: viewId }],
    })

    await expect(
      formService.createView({ applicationId, formId, input: {} })
    ).resolves.toMatchObject({ id: viewId })

    expect(formModel.findOneAndUpdate.mock.calls.at(0)?.at(0)).toMatchObject({
      _id: formId,
      applicationId,
      deletedAt: null,
    })
    expect(formModel.findOneAndUpdate.mock.calls.at(0)?.at(1)).toMatchObject({
      $set: {
        updatedAt: expect.any(Number),
      },
    })
    expect(formModel.findOneAndUpdate.mock.calls.at(0)?.at(2)).toMatchObject({
      new: true,
    })
  })

  test('should throw not found error if form not exist when create view', async () => {
    const applicationId = new mongo.ObjectId().toHexString()
    const formId = new mongo.ObjectId().toHexString()

    formModel.findOneAndUpdate.mockReturnValue(undefined)

    await expect(formService.createView({ applicationId, formId, input: {} })).rejects.toThrow(
      /not found/i
    )
  })

  test('should return updated view', async () => {
    const applicationId = new mongo.ObjectId().toHexString()
    const formId = new mongo.ObjectId().toHexString()
    const viewId = new mongo.ObjectId().toHexString()

    formModel.findOneAndUpdate.mockReturnValue({
      id: formId,
      applicationId,
      views: [{ id: viewId }],
    })

    await expect(
      formService.updateView({ applicationId, formId, viewId, input: {} })
    ).resolves.toMatchObject({ id: viewId })

    expect(formModel.findOneAndUpdate.mock.calls.at(0)?.at(0)).toMatchObject({
      _id: formId,
      applicationId,
      deletedAt: null,
    })
    expect(formModel.findOneAndUpdate.mock.calls.at(0)?.at(1)).toMatchObject({
      $set: {
        updatedAt: expect.any(Number),
      },
    })
    expect(formModel.findOneAndUpdate.mock.calls.at(0)?.at(2)).toMatchObject({
      new: true,
    })
  })

  test('should throw not found error if updating view not exist', async () => {
    const applicationId = new mongo.ObjectId().toHexString()
    const formId = new mongo.ObjectId().toHexString()
    const viewId = new mongo.ObjectId().toHexString()

    formModel.findOneAndUpdate.mockReturnValue({ id: formId, applicationId, views: [] })

    await expect(
      formService.updateView({ applicationId, formId, viewId, input: {} })
    ).rejects.toThrow(/not found/i)
  })

  test('should return deleted view', async () => {
    const applicationId = new mongo.ObjectId().toHexString()
    const formId = new mongo.ObjectId().toHexString()
    const viewId = new mongo.ObjectId().toHexString()

    formModel.findOne.mockReturnValue({
      id: formId,
      applicationId,
      views: [{ id: viewId }],
    })

    await expect(formService.deleteView({ applicationId, formId, viewId })).resolves.toMatchObject({
      id: viewId,
    })

    expect(formModel.findOneAndUpdate.mock.calls.at(0)?.at(0)).toMatchObject({
      _id: formId,
      applicationId,
      deletedAt: null,
    })
    expect(formModel.findOneAndUpdate.mock.calls.at(0)?.at(1)).toMatchObject({
      $set: { updatedAt: expect.any(Number) },
      $pull: { views: { _id: viewId } },
    })
  })

  test('should throw not found error if deleting view not found', async () => {
    const applicationId = new mongo.ObjectId().toHexString()
    const formId = new mongo.ObjectId().toHexString()
    const viewId = new mongo.ObjectId().toHexString()

    formModel.findOne.mockReturnValue({ id: formId, applicationId, views: [] })

    await expect(formService.deleteView({ applicationId, formId, viewId })).rejects.toThrow(
      /not found/i
    )
  })
})
