import { Directive, Field, ID, ObjectType } from '@nestjs/graphql'
import { Product } from './product.entity'

/**
 * User Type Extension in Products Service
 *
 * This is NOT the full User type - it's an EXTENSION
 *
 * Key Federation Directives:
 * - @extends: Tells the Gateway this type is defined elsewhere (users service)
 * - @key: Indicates how to identify/fetch this entity
 * - @external: Marks fields that come from the owning service
 *
 * This allows the products service to add the 'products' field to User
 * without needing to know about or duplicate all User fields.
 */
@ObjectType()
@Directive('@extends') // This type extends the User type from another service
@Directive('@key(fields: "id")') // The key to identify users
export class User {
  /**
   * The user's ID
   * @external means this field comes from the users service
   * We need it here to identify which user we're extending
   */
  @Field(() => ID)
  @Directive('@external') // This field is owned by the users service
  id: string

  /**
   * Products belonging to this user
   * This field is ADDED by the products service!
   * It doesn't exist in the users service definition
   */
  @Field(() => [Product])
  products?: Product[]

  // We don't define name, email, etc. here
  // Those fields remain in the users service
}
