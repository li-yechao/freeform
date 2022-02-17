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

import * as BPMNModdle from 'bpmn-moddle'
import { mongo } from 'mongoose'
import { Workflow } from '../schemas/workflow.schema'

const xmlFormatter = require('xml-formatter')
const camundaModdle = require('camunda-bpmn-moddle/resources/camunda')

export default async function workflowToBpmn(
  workflow: Pick<Workflow, 'id' | 'trigger' | 'children'>
): Promise<string> {
  if (!workflow.trigger || !workflow.children?.length) {
    throw new Error(`Invalid workflow`)
  }
  const moddle = new BPMNModdle({ camunda: camundaModdle })

  const model = moddle.create('bpmn:Definitions', {
    targetNamespace: 'http://bpmn.io/schema/bpmn',
    rootElements: [],
  })

  const process = moddle.create('bpmn:Process', {
    id: `Process_${workflow.id}`,
    isExecutable: true,
    flowElements: [],
  })
  model.rootElements.push(process)

  const startEvent = moddle.create('bpmn:StartEvent', {
    id: `StartEvent_${new mongo.ObjectId().toHexString()}`,
  })
  process.flowElements.push(startEvent)

  let current: BPMNModdle.FlowNode = startEvent

  for (const node of [workflow.trigger, ...workflow.children]) {
    const createTask = (
      process: BPMNModdle.Process,
      prevTask: BPMNModdle.FlowNode,
      descriptor: keyof Pick<
        BPMNModdle.ElementTypes,
        'bpmn:Task' | 'bpmn:ServiceTask'
      > = 'bpmn:Task',
      attrs?: { [key: string]: any }
    ) => {
      const flow = moddle.create('bpmn:SequenceFlow', {
        id: `Flow_${new mongo.ObjectId().toHexString()}`,
      })
      const task = moddle.create(descriptor, {
        id: `Activity_${new mongo.ObjectId().toHexString()}`,
        ...attrs,
      })
      flow.sourceRef = prevTask
      flow.targetRef = task
      task.incoming = [flow]
      prevTask.outgoing = [flow]
      process.flowElements.push(flow, task)
      return task
    }

    switch (node.type) {
      case 'form_trigger': {
        current = createTask(process, current)
        break
      }
      case 'script_js': {
        const task = createTask(process, current, 'bpmn:ServiceTask', {
          'camunda:type': 'external',
          'camunda:topic': 'script_js',
        })
        task.extensionElements = moddle.create('bpmn:ExtensionElements', {
          values: [
            moddle.create('camunda:InputOutput', {
              inputParameters: [
                moddle.create('camunda:InputParameter', {
                  name: `${task.id}_script`,
                  value: node.script && Buffer.from(node.script).toString('base64'),
                }),
              ],
            }),
          ],
        })
        current = task
        break
      }
      default:
        throw new Error(`Unsupported node type ${node}`)
    }
  }

  {
    const flow = moddle.create('bpmn:SequenceFlow', {
      id: `Flow_${new mongo.ObjectId().toHexString()}`,
      sourceRef: current,
    })

    const endEvent = moddle.create('bpmn:EndEvent', {
      id: `EndEvent_${new mongo.ObjectId().toHexString()}`,
    })

    current.outgoing = [flow]
    flow.targetRef = endEvent
    endEvent.incoming = [flow]

    process.flowElements.push(flow, endEvent)
  }

  return xmlFormatter((await (moddle as any).toXML(model)).xml)
}
