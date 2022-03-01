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

import { forwardRef, Inject, Injectable } from '@nestjs/common'
import fetch from 'cross-fetch'
import { ModuleKind, ScriptTarget, transpileModule } from 'typescript'
import { NodeVM } from 'vm2'
import { ThirdDepartment, ThirdUser } from '../schemas/third-user.schema'
import { ApplicationService } from './application.service'

export interface ThirdUserModule {
  getDepartments(query?: {
    departmentId?: string
    departmentIds?: string[]
  }): Promise<{ id: string; name: string; parentId?: string }[]>

  getDepartment(query: {
    departmentId: string
  }): Promise<{ id: string; name: string; parentId?: string }>

  getUsers(query: {
    departmentId?: string
    userIds?: string[]
  }): Promise<{ id: string; name: string; departmentId: string }[]>

  getUser(query: { userId: string }): Promise<{ id: string; name: string; departmentId: string }>
}

@Injectable()
export class ThirdUserService {
  constructor(
    @Inject(forwardRef(() => ApplicationService))
    private readonly applicationService: ApplicationService
  ) {}

  async getDepartments({
    applicationId,
    query,
  }: {
    applicationId: string
    query?: { departmentId?: string; departmentIds?: string[] }
  }): Promise<ThirdDepartment[]> {
    const mod = await this.getModule(applicationId)
    const departments = await mod.getDepartments(query)
    return departments.map(i => ({ ...i, applicationId }))
  }

  async getDepartment({
    applicationId,
    query,
  }: {
    applicationId: string
    query: { departmentId: string }
  }): Promise<ThirdDepartment> {
    const mod = await this.getModule(applicationId)
    const department = await mod.getDepartment(query)
    return { ...department, applicationId }
  }

  async getUsers({
    applicationId,
    query,
  }: {
    applicationId: string
    query: { departmentId?: string; userIds?: string[] }
  }): Promise<ThirdUser[]> {
    const mod = await this.getModule(applicationId)
    const users = await mod.getUsers(query)
    return users.map(i => ({ ...i, applicationId }))
  }

  async getUser({
    applicationId,
    query,
  }: {
    applicationId: string
    query: { userId: string }
  }): Promise<ThirdUser> {
    const mod = await this.getModule(applicationId)
    const user = await mod.getUser(query)
    return { ...user, applicationId }
  }

  private static moduleMap = new Map<string, Promise<ThirdUserModule>>()

  private async getModule(applicationId: string) {
    let m = ThirdUserService.moduleMap.get(applicationId)
    if (!m) {
      m = (async () => {
        const script = (await this.applicationService.selectApplicationById(applicationId))
          ?.thirdScript

        if (!script) {
          throw new Error(`Application script is null`)
        }

        const vm = new NodeVM({
          sandbox: { fetch },
        })

        const M = vm.run(
          transpileModule(script, {
            compilerOptions: {
              module: ModuleKind.CommonJS,
              target: ScriptTarget.ES2021,
            },
          }).outputText
        ).default

        return new M()
      })()

      ThirdUserService.moduleMap.set(applicationId, m)
    }
    return m
  }

  async markModuleChanged(applicationId: string) {
    ThirdUserService.moduleMap.delete(applicationId)
  }
}
