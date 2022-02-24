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

import { Injectable } from '@nestjs/common'
import fetch from 'cross-fetch'
import { existsSync } from 'fs'
import { join } from 'path'
import { NodeVM } from 'vm2'

export interface ThirdUserModule {
  getViewer(
    ctx: ThirdUserModuleContext,
    query?: { [key: string]: string | undefined }
  ): Promise<{ id: string; user: { [key: string]: any } }>
}

export interface ThirdUserModuleContext {
  get<K, T>(key: K): T | undefined
  set<K, T>(key: K, value: T): void
}

@Injectable()
export class ThirdUserService {
  async getViewer(
    type: string,
    query: { [key: string]: string }
  ): Promise<{ id: string; user: { [key: string]: any } }> {
    const mod = this.getModule(type)

    const ctx = this.newContext()

    const thirdUser = await mod.getViewer(ctx, query)

    if (
      !thirdUser ||
      typeof thirdUser.id !== 'string' ||
      !thirdUser.id ||
      typeof thirdUser.user !== 'object'
    ) {
      throw new Error('Invalid third viewer')
    }

    this.setContext(this.contextKey(type, thirdUser.id), ctx)

    return {
      id: thirdUser.id,
      user: thirdUser.user,
    }
  }

  private moduleMap = new Map<string, ThirdUserModule>()

  private getModule(type: string) {
    let m = this.moduleMap.get(type)
    if (!m) {
      const file = join(process.cwd(), 'config', `third_${type}.js`)
      if (!existsSync(file)) {
        throw new Error(`Unsupported auth type ${type}`)
      }

      const vm = new NodeVM({
        sandbox: {
          fetch,
        },
        env: Object.entries(process.env)
          .filter(([key]) => key.startsWith(type))
          .reduce((res, [key, value]) => Object.assign(res, { [key]: value }), {}),
      })
      m = vm.runFile(file) as ThirdUserModule
      this.moduleMap.set(type, m)
    }
    return m
  }

  private contextMap = new Map<string, ThirdUserModuleContext>()

  private newContext(): ThirdUserModuleContext {
    return new Map()
  }

  private contextKey(type: string, id: string) {
    return `${id}@${type}`
  }

  private setContext(key: string, ctx: ThirdUserModuleContext) {
    this.contextMap.set(key, ctx)
  }
}