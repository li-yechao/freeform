import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const cors = app.get(ConfigService).get<string>('CORS') === 'true'
  if (cors) {
    app.enableCors()
  }

  const port = app.get(ConfigService).get<string>('PORT')
  if (!port) {
    throw new Error('Required env PORT is not present')
  }

  await app.listen(port)
}

bootstrap()
