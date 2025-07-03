import { Directive, Field, ID, ObjectType } from '@nestjs/graphql'

/**
 * User Entity - The main type owned by the users service
 *
 * The @key directive is crucial for GraphQL Federation!
 * It tells the Gateway that this service is the "owner" of the User type
 * and that entities can be uniquely identified by the "id" field.
 *
 * This allows:
 * 1. Other services to reference Users by ID
 * 2. The Gateway to fetch User data when needed
 * 3. Other services to extend this type with additional fields
 */
@ObjectType()
@Directive('@key(fields: "id")') // Defines 'id' as the primary key for federation
export class User {
  @Field(() => ID)
  id: string

  @Field()
  email: string

  @Field()
  name: string

  // Note: We don't include the password field here for security
  // It exists in the database but is never exposed via GraphQL

  @Field()
  createdAt: Date

  @Field()
  updatedAt: Date

  // The 'products' field is NOT defined here
  // It's added by the products service through type extension
}
