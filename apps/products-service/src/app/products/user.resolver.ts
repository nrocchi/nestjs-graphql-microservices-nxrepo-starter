import { Parent, ResolveField, Resolver } from '@nestjs/graphql'
import { ProductsService } from './products.service'
import { Product } from './entities/product.entity'
import { User } from './entities/user.entity'
import type { IProduct as GeneratedProduct, IUser as GeneratedUser } from '../../generated/graphql'

/**
 * User Resolver for the Products Service
 *
 * This is a key component of GraphQL Federation!
 * Even though the User entity is defined in the users service,
 * the products service can EXTEND the User type to add new fields.
 *
 * This allows us to query a user and their products in a single request:
 * query {
 *   user(id: "123") {
 *     name           # Resolved by users service
 *     email          # Resolved by users service
 *     products {     # Resolved by THIS resolver in products service
 *       name
 *       price
 *     }
 *   }
 * }
 */
@Resolver(() => User)
export class UserResolver {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * Resolves the 'products' field on the User type
   * This field doesn't exist in the users service - we're extending the type!
   *
   * @param user - The parent User object (only contains id from federation)
   * @returns Array of products belonging to this user
   *
   * Federation flow:
   * 1. Gateway receives query for user with products
   * 2. Gateway queries users service for user data
   * 3. Gateway then calls THIS resolver with the user reference
   * 4. This resolver fetches all products for the user
   * 5. Gateway combines the results and returns to client
   */
  @ResolveField(() => [Product])
  async products(@Parent() user: User): Promise<GeneratedProduct[]> {
    const products = await this.productsService.findByUser(user.id)
    return products.map((product) => this.toGraphQLProduct(product))
  }

  /**
   * Helper method to transform Prisma Product to GraphQL Product
   * This ensures all fields match the generated GraphQL types
   */
  private toGraphQLProduct(prismaProduct: {
    id: string
    name: string
    description: string
    price: number
    sku: string
    stock: number
    userId: string
    createdAt: Date
    updatedAt: Date
  }): GeneratedProduct {
    return {
      __typename: 'Product',
      id: prismaProduct.id,
      name: prismaProduct.name,
      description: prismaProduct.description,
      price: prismaProduct.price,
      sku: prismaProduct.sku,
      stock: prismaProduct.stock,
      userId: prismaProduct.userId,
      createdAt: prismaProduct.createdAt.toISOString(),
      updatedAt: prismaProduct.updatedAt.toISOString(),
      // The user field is resolved by the parent User
      user: { __typename: 'User', id: prismaProduct.userId } as GeneratedUser,
    }
  }
}
