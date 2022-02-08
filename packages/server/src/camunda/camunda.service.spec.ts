import { Test, TestingModule } from '@nestjs/testing'
import { CamundaService } from './camunda.service'

describe('CamundaService', () => {
  let service: CamundaService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CamundaService],
    }).compile()

    service = module.get<CamundaService>(CamundaService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
