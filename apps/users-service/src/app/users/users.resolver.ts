import { Args, Mutation, Query, Resolver, ResolveReference } from '@nestjs/graphql'
import { UsersService } from './users.service'
import { User } from './entities/user.entity'
import { CreateUserInput } from './dto/create-user.input'
import { UpdateUserInput } from './dto/update-user.input'

/**
 * GraphQL Resolver for User entity
 * This resolver is part of the users subgraph in a federated GraphQL architecture.
 * It provides all the queries and mutations for user management.
 */
@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Creates a new user
   * @param createUserInput - Input data for creating a user
   * @returns The created user
   */
  @Mutation(() => User)
  createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
    return this.usersService.create(createUserInput)
  }

  /**
   * Retrieves all users
   * @returns Array of all users
   */
  @Query(() => [User], { name: 'users' })
  findAll() {
    return this.usersService.findAll()
  }

  /**
   * Retrieves a single user by ID
   * @param id - The user's ID
   * @returns The user if found, null otherwise
   */
  @Query(() => User, { name: 'user', nullable: true })
  findOne(@Args('id') id: string) {
    return this.usersService.findOne(id)
  }

  /**
   * Updates an existing user
   * @param updateUserInput - Input data containing ID and fields to update
   * @returns The updated user
   */
  @Mutation(() => User)
  updateUser(@Args('updateUserInput') updateUserInput: UpdateUserInput) {
    return this.usersService.update(updateUserInput.id, updateUserInput)
  }

  /**
   * Removes a user by ID
   * @param id - The user's ID to remove
   * @returns The removed user
   */
  @Mutation(() => User)
  removeUser(@Args('id') id: string) {
    return this.usersService.remove(id)
  }

  /**
   * Federation reference resolver
   * This method is crucial for GraphQL Federation. It allows other services
   * to resolve User entities when they only have a reference (id).
   * For example, when the products service needs to resolve the 'user' field
   * on a Product, it will call this method with the userId.
   * @param reference - Object containing __typename and id
   * @returns The resolved user entity
   */
  @ResolveReference()
  resolveReference(reference: { __typename: string; id: string }) {
    return this.usersService.findOne(reference.id)
  }
}
