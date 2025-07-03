import { Directive, Field, Float, ID, Int, ObjectType } from '@nestjs/graphql'

/**
 * Product Entity - The main type owned by the products service
 *
 * Like the User entity, this uses the @key directive for federation.
 * The products service is the authoritative source for Product data.
 */
@ObjectType()
@Directive('@key(fields: "id")') // Enables federation with 'id' as the key
export class Product {
  @Field(() => ID)
  id: string

  @Field()
  name: string

  @Field({ nullable: true })
  description?: string

  @Field(() => Float)
  price: number

  @Field()
  sku: string // Stock Keeping Unit - unique identifier for inventory

  @Field(() => Int)
  stock: number

  /**
   * Foreign key to User
   * Note: We only store the userId, not the full User object
   * The actual User data is fetched via federation when needed
   * This maintains service independence - we don't need to know
   * about User structure in the products service
   */
  @Field()
  userId: string

  @Field()
  createdAt: Date

  @Field()
  updatedAt: Date

  // The 'user' field is resolved via @ResolveField in the resolver
  // It returns a reference that the Gateway uses to fetch full user data
}
