import { NestFactory } from '@nestjs/core'
import { AppModule } from './app/app.module'
import { Logger } from '@nestjs/common'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const port = process.env.PORT || 3001
  await app.listen(port)
  Logger.log(`🚀 Users service is running on: http://localhost:${port}`, 'Bootstrap')
  Logger.log(`🚀 GraphQL endpoint: http://localhost:${port}/graphql`, 'Bootstrap')
}

bootstrap()
