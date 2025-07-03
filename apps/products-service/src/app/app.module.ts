import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { ApolloFederationDriver, ApolloFederationDriverConfig } from '@nestjs/apollo'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './prisma/prisma.module'
import { ProductsModule } from './products/products.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: {
        federation: 2,
      },
      playground: true,
    }),
    PrismaModule,
    ProductsModule,
  ],
})
export class AppModule {}
