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
  createProduct(@Args('createProductInput') createProductInput: CreateProductInput) {
    return this.productsService.create(createProductInput)
  }

  /**
   * Retrieves all products
   * @returns Array of all products
   */
  @Query(() => [Product], { name: 'products' })
  findAll() {
    return this.productsService.findAll()
  }

  /**
   * Retrieves a single product by ID
   * @param id - The product's ID
   * @returns The product if found, null otherwise
   */
  @Query(() => Product, { name: 'product', nullable: true })
  findOne(@Args('id') id: string) {
    return this.productsService.findOne(id)
  }

  /**
   * Retrieves all products for a specific user
   * This is a direct query - different from the federated approach
   * @param userId - The user's ID
   * @returns Array of products belonging to the user
   */
  @Query(() => [Product], { name: 'productsByUser' })
  findByUser(@Args('userId') userId: string) {
    return this.productsService.findByUser(userId)
  }

  /**
   * Updates an existing product
   * @param updateProductInput - Input data containing ID and fields to update
   * @returns The updated product
   */
  @Mutation(() => Product)
  updateProduct(@Args('updateProductInput') updateProductInput: UpdateProductInput) {
    return this.productsService.update(updateProductInput.id, updateProductInput)
  }

  /**
   * Removes a product by ID
   * @param id - The product's ID to remove
   * @returns The removed product
   */
  @Mutation(() => Product)
  removeProduct(@Args('id') id: string) {
    return this.productsService.remove(id)
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
  user(@Parent() product: Product) {
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
  resolveReference(reference: { __typename: string; id: string }) {
    return this.productsService.findOne(reference.id)
  }
}
