import { Args, Mutation, Query, Resolver, ResolveReference } from '@nestjs/graphql'
import { UsersService } from './users.service'
import { User } from './entities/user.entity'
import { CreateUserInput } from './dto/create-user.input'
import { UpdateUserInput } from './dto/update-user.input'
import type { IUser as GeneratedUser } from '../../generated/graphql'

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
  async createUser(
    @Args('createUserInput') createUserInput: CreateUserInput
  ): Promise<GeneratedUser> {
    const user = await this.usersService.create(createUserInput)
    return this.toGraphQLUser(user)
  }

  /**
   * Retrieves all users
   * @returns Array of all users
   */
  @Query(() => [User], { name: 'users' })
  async findAll(): Promise<GeneratedUser[]> {
    const users = await this.usersService.findAll()
    return users.map((user) => this.toGraphQLUser(user))
  }

  /**
   * Retrieves a single user by ID
   * @param id - The user's ID
   * @returns The user if found, null otherwise
   */
  @Query(() => User, { name: 'user', nullable: true })
  async findOne(@Args('id') id: string): Promise<GeneratedUser | null> {
    const user = await this.usersService.findOne(id)
    return user ? this.toGraphQLUser(user) : null
  }

  /**
   * Updates an existing user
   * @param updateUserInput - Input data containing ID and fields to update
   * @returns The updated user
   */
  @Mutation(() => User)
  async updateUser(
    @Args('updateUserInput') updateUserInput: UpdateUserInput
  ): Promise<GeneratedUser> {
    const user = await this.usersService.update(updateUserInput.id, updateUserInput)
    return this.toGraphQLUser(user)
  }

  /**
   * Removes a user by ID
   * @param id - The user's ID to remove
   * @returns The removed user
   */
  @Mutation(() => User)
  async removeUser(@Args('id') id: string): Promise<GeneratedUser> {
    const user = await this.usersService.remove(id)
    return this.toGraphQLUser(user)
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
  async resolveReference(reference: {
    __typename: string
    id: string
  }): Promise<GeneratedUser | null> {
    const user = await this.usersService.findOne(reference.id)
    return user ? this.toGraphQLUser(user) : null
  }

  /**
   * Helper method to transform Prisma User to GraphQL User
   * This ensures all fields match the generated GraphQL types
   */
  private toGraphQLUser(prismaUser: {
    id: string
    email: string
    name: string
    createdAt: Date
    updatedAt: Date
  }): GeneratedUser {
    return {
      __typename: 'User',
      id: prismaUser.id,
      email: prismaUser.email,
      name: prismaUser.name,
      createdAt: prismaUser.createdAt.toISOString(),
      updatedAt: prismaUser.updatedAt.toISOString(),
    }
  }
}
