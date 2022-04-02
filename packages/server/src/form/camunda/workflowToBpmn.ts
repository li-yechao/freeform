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

// eslint-disable-next-line @typescript-eslint/no-var-requires
const xmlFormatter = require('xml-formatter')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const zeebeModdle = require('zeebe-bpmn-moddle/resources/zeebe')

export default async function workflowToBpmn(
  workflow: Pick<Workflow, 'id' | 'trigger' | 'children'>
): Promise<string> {
  if (!workflow.trigger || !workflow.children?.length) {
    throw new Error(`Invalid workflow`)
  }
  const moddle = new BPMNModdle({ zeebe: zeebeModdle })

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

  const endEvent = moddle.create('bpmn:EndEvent', {
    id: `EndEvent_${new mongo.ObjectId().toHexString()}`,
  })

  const startFlow = moddle.create('bpmn:SequenceFlow', {
    id: `Flow_${new mongo.ObjectId().toHexString()}`,
  })

  startEvent.outgoing = [startFlow]
  startFlow.sourceRef = startEvent

  process.flowElements.push(startEvent, endEvent, startFlow)

  let current: BPMNModdle.SequenceFlow = startFlow

  for (const node of workflow.children) {
    const createTask = (
      process: BPMNModdle.Process,
      incoming: BPMNModdle.SequenceFlow,
      descriptor: keyof Pick<
        BPMNModdle.ElementTypes,
        'bpmn:Task' | 'bpmn:ServiceTask' | 'bpmn:UserTask'
      > = 'bpmn:Task',
      attrs?: { [key: string]: any }
    ) => {
      const task = moddle.create(descriptor, {
        id: `Activity_${new mongo.ObjectId().toHexString()}`,
        ...attrs,
      })
      const flow = moddle.create('bpmn:SequenceFlow', {
        id: `Flow_${new mongo.ObjectId().toHexString()}`,
      })

      incoming.targetRef = task
      task.incoming = [incoming]
      task.outgoing = [flow]
      flow.sourceRef = task
      process.flowElements.push(flow, task)
      return [task, flow] as const
    }

    switch (node.type) {
      case 'script_js': {
        const [task, flow] = createTask(process, current, 'bpmn:ServiceTask', {})
        task.extensionElements = moddle.create('bpmn:ExtensionElements', {
          values: [
            moddle.create('zeebe:TaskDefinition', {
              type: 'script_js',
            }),
            moddle.create('zeebe:TaskHeaders', {
              values: [
                moddle.create('zeebe:Header', {
                  key: 'script',
                  value: Buffer.from(node.script || '').toString('base64'),
                }),
              ],
            }),
          ],
        })
        current = flow
        break
      }
      case 'approval': {
        if (node.approvals?.type === 'script_js') {
          const inputCollection = `inputCollection_${node.id}`
          const outputCollection = `outputCollection_${node.id}`

          {
            const [task, flow] = createTask(process, current, 'bpmn:ServiceTask', {})
            task.extensionElements = moddle.create('bpmn:ExtensionElements', {
              values: [
                moddle.create('zeebe:TaskDefinition', {
                  type: 'script_js',
                }),
                moddle.create('zeebe:TaskHeaders', {
                  values: [
                    moddle.create('zeebe:Header', {
                      key: 'script',
                      value: Buffer.from(node.approvals.script || '').toString('base64'),
                    }),
                  ],
                }),
                moddle.create('zeebe:IoMapping', {
                  outputParameters: [
                    moddle.create('zeebe:Output', {
                      source: '= approvals',
                      target: inputCollection,
                    }),
                  ],
                }),
              ],
            })
            current = flow
          }

          {
            const [task, flow] = createTask(process, current, 'bpmn:UserTask', {})
            task.extensionElements = moddle.create('bpmn:ExtensionElements', {
              values: [
                moddle.create('zeebe:AssignmentDefinition', {
                  assignee: '= assignee',
                }),
              ],
            })

            const loopCharacteristics = moddle.create('bpmn:MultiInstanceLoopCharacteristics')
            loopCharacteristics.extensionElements = moddle.create('bpmn:ExtensionElements', {
              values: [
                moddle.create('zeebe:LoopCharacteristics', {
                  inputCollection: `= ${inputCollection}`,
                  inputElement: 'assignee',
                  outputCollection: `${outputCollection}`,
                  outputElement: '= result',
                }),
              ],
            })
            loopCharacteristics.completionCondition = moddle.create('bpmn:FormalExpression', {
              body:
                node.multipleConditionType === 'or'
                  ? `= some x in ${outputCollection} satisfies x = "resolved" or x = "rejected"`
                  : `= or([ some x in ${outputCollection} satisfies x = "rejected", every x in ${outputCollection} satisfies x = "resolved" ])`,
            })

            task.loopCharacteristics = loopCharacteristics

            {
              const gateway = moddle.create('bpmn:ExclusiveGateway', {
                id: `Gateway_${new mongo.ObjectId().toHexString()}`,
              })

              flow.targetRef = gateway
              gateway.incoming = [flow]

              const endFlow = moddle.create('bpmn:SequenceFlow', {
                id: `Flow_${new mongo.ObjectId().toHexString()}`,
              })
              const outFlow = moddle.create('bpmn:SequenceFlow', {
                id: `Flow_${new mongo.ObjectId().toHexString()}`,
              })

              gateway.outgoing = [endFlow, outFlow]
              gateway.default = endFlow

              endFlow.sourceRef = gateway
              endFlow.targetRef = endEvent

              outFlow.sourceRef = gateway
              outFlow.conditionExpression = moddle.create('bpmn:FormalExpression', {
                body:
                  node.multipleConditionType === 'or'
                    ? `= and([ some x in ${outputCollection} satisfies x = "resolved", every x in ${outputCollection} satisfies x != "rejected" ])`
                    : `= every x in ${outputCollection} satisfies x = "resolved"`,
              })

              process.flowElements.push(gateway, endFlow, outFlow)

              current = outFlow
            }
          }
        } else {
          throw new Error(`Unsupported approvals type ${node.approvals?.type}`)
        }
        break
      }
      default:
        throw new Error(`Unsupported node type ${node}`)
    }
  }

  {
    current.targetRef = endEvent
    endEvent.incoming = [current]
  }

  return xmlFormatter((await (moddle as any).toXML(model)).xml)
}
