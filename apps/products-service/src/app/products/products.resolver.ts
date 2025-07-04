import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
  ResolveReference,
} from '@nestjs/graphql'
import { ProductsService } from './products.service'
import { Product } from './entities/product.entity'
import { CreateProductInput } from './dto/create-product.input'
import { UpdateProductInput } from './dto/update-product.input'
import { User } from './entities/user.entity'
import type { IProduct as GeneratedProduct, IUser as GeneratedUser } from '../../generated/graphql'

/**
 * GraphQL Resolver for Product entity
 * This resolver is part of the products subgraph in a federated GraphQL architecture.
 * It provides all the queries and mutations for product management.
 */
@Resolver(() => Product)
export class ProductsResolver {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * Creates a new product
   * @param createProductInput - Input data for creating a product
   * @returns The created product
   */
  @Mutation(() => Product)
  async createProduct(
    @Args('createProductInput') createProductInput: CreateProductInput
  ): Promise<GeneratedProduct> {
    const product = await this.productsService.create(createProductInput)
    return this.toGraphQLProduct(product)
  }

  /**
   * Retrieves all products
   * @returns Array of all products
   */
  @Query(() => [Product], { name: 'products' })
  async findAll(): Promise<GeneratedProduct[]> {
    const products = await this.productsService.findAll()
    return products.map((product) => this.toGraphQLProduct(product))
  }

  /**
   * Retrieves a single product by ID
   * @param id - The product's ID
   * @returns The product if found, null otherwise
   */
  @Query(() => Product, { name: 'product', nullable: true })
  async findOne(@Args('id') id: string): Promise<GeneratedProduct | null> {
    const product = await this.productsService.findOne(id)
    return product ? this.toGraphQLProduct(product) : null
  }

  /**
   * Retrieves all products for a specific user
   * This is a direct query - different from the federated approach
   * @param userId - The user's ID
   * @returns Array of products belonging to the user
   */
  @Query(() => [Product], { name: 'productsByUser' })
  async findByUser(@Args('userId') userId: string): Promise<GeneratedProduct[]> {
    const products = await this.productsService.findByUser(userId)
    return products.map((product) => this.toGraphQLProduct(product))
  }

  /**
   * Updates an existing product
   * @param updateProductInput - Input data containing ID and fields to update
   * @returns The updated product
   */
  @Mutation(() => Product)
  async updateProduct(
    @Args('updateProductInput') updateProductInput: UpdateProductInput
  ): Promise<GeneratedProduct> {
    const product = await this.productsService.update(updateProductInput.id, updateProductInput)
    return this.toGraphQLProduct(product)
  }

  /**
   * Removes a product by ID
   * @param id - The product's ID to remove
   * @returns The removed product
   */
  @Mutation(() => Product)
  async removeProduct(@Args('id') id: string): Promise<GeneratedProduct> {
    const product = await this.productsService.remove(id)
    return this.toGraphQLProduct(product)
  }

  /**
   * Resolves the 'user' field on Product
   * This is the inverse of the products field on User.
   * When someone queries a product and wants the user data,
   * this returns a reference that the Gateway will use to fetch
   * the full user data from the users service.
   *
   * Example query:
   * query {
   *   product(id: "123") {
   *     name
   *     price
   *     user {      # This field triggers the federation
   *       name      # Gateway fetches this from users service
   *       email     # Gateway fetches this from users service
   *     }
   *   }
   * }
   *
   * @param product - The parent Product object
   * @returns A reference object with __typename and id for federation
   */
  @ResolveField(() => User)
  user(@Parent() product: GeneratedProduct): Partial<GeneratedUser> {
    // Return a reference that Apollo Gateway will resolve
    // The __typename tells Gateway which service owns this type
    return { __typename: 'User', id: product.userId }
  }

  /**
   * Federation reference resolver for Product
   * This allows other services to resolve Product entities
   * when they only have a reference (id).
   * @param reference - Object containing __typename and id
   * @returns The resolved product entity
   */
  @ResolveReference()
  async resolveReference(reference: {
    __typename: string
    id: string
  }): Promise<GeneratedProduct | null> {
    const product = await this.productsService.findOne(reference.id)
    return product ? this.toGraphQLProduct(product) : null
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
      // The user field is resolved by the @ResolveField decorator
      user: { __typename: 'User', id: prismaProduct.userId } as GeneratedUser,
    }
  }
}
