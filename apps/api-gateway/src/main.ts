import { NestFactory } from '@nestjs/core'
import { AppModule } from './app/app.module'
import { Logger } from '@nestjs/common'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableCors()
  const globalPrefix = 'api'
  app.setGlobalPrefix(globalPrefix)
  const port = process.env.PORT || 3000
  await app.listen(port)
  Logger.log(`🚀 Gateway is running on: http://localhost:${port}/${globalPrefix}`, 'Bootstrap')
  Logger.log(`🚀 GraphQL Playground: http://localhost:${port}/graphql`, 'Bootstrap')
}

bootstrap()
