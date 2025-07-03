import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { ApolloGatewayDriver, ApolloGatewayDriverConfig } from '@nestjs/apollo'
import { IntrospectAndCompose } from '@apollo/gateway'
import { ConfigModule } from '@nestjs/config'

/**
 * API Gateway Module
 *
 * This is the entry point for all GraphQL requests in our federated architecture.
 * The Gateway's responsibilities:
 *
 * 1. Schema Composition: Combines schemas from all microservices into one supergraph
 * 2. Query Planning: Determines which services to query for each request
 * 3. Query Execution: Orchestrates calls to multiple services
 * 4. Result Assembly: Combines responses from different services
 *
 * Example flow:
 * - Client requests: { user(id: "123") { name, products { name, price } } }
 * - Gateway creates execution plan:
 *   1. Call users service for user name
 *   2. Call products service with userId to get products
 * - Gateway combines results and returns unified response
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GraphQLModule.forRoot<ApolloGatewayDriverConfig>({
      driver: ApolloGatewayDriver,
      gateway: {
        /**
         * IntrospectAndCompose automatically discovers service schemas
         * In production, you might use a managed federation service
         * or provide a static supergraph schema
         */
        supergraphSdl: new IntrospectAndCompose({
          subgraphs: [
            // Each subgraph represents a microservice
            {
              name: 'users',
              url: process.env.USERS_SERVICE_URL || 'http://localhost:3001/graphql',
            },
            {
              name: 'products',
              url: process.env.PRODUCTS_SERVICE_URL || 'http://localhost:3002/graphql',
            },
            // Add more services here as your system grows
          ],
        }),
      },
    }),
  ],
})
export class AppModule {}
