import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateUserInput } from './dto/create-user.input'
import { UpdateUserInput } from './dto/update-user.input'
import * as bcrypt from 'bcryptjs'
import { isValidUUID } from '@libs/utils'
import {
  DuplicateResourceException,
  InvalidFormatException,
  ResourceNotFoundException,
} from '@libs/exceptions'
import type { User as PrismaUser } from '@prisma/client-users'

/**
 * Service responsible for managing user operations.
 * This service is part of the users microservice in a GraphQL Federation architecture.
 * It handles all CRUD operations for users and is exposed through GraphQL resolvers.
 */
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Creates a new user with hashed password
   * @param createUserInput - User data for creation
   * @returns Created user object
   * @throws BadRequestException if email already exists
   */
  async create(createUserInput: CreateUserInput): Promise<PrismaUser> {
    try {
      // Hash password before storing in database
      const hashedPassword = await bcrypt.hash(createUserInput.password, 10)
      return await this.prisma.user.create({
        data: {
          ...createUserInput,
          password: hashedPassword,
        },
      })
    } catch (error) {
      // Handle unique constraint error (P2002) for email
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        throw new DuplicateResourceException('Email')
      }
      throw error
    }
  }

  /**
   * Retrieves all users from the database
   * @returns Array of all users
   */
  findAll(): Promise<PrismaUser[]> {
    return this.prisma.user.findMany()
  }

  /**
   * Finds a single user by ID
   * This method is used by both direct queries and federation reference resolvers
   * @param id - User ID (must be valid UUID)
   * @returns User object or null if not found
   * @throws BadRequestException if ID format is invalid
   */
  findOne(id: string): Promise<PrismaUser | null> {
    // Validate UUID format
    if (!isValidUUID(id)) {
      throw new InvalidFormatException('ID', id)
    }

    return this.prisma.user.findUnique({
      where: { id },
    })
  }

  /**
   * Finds a user by email address
   * @param email - User's email
   * @returns User object or null if not found
   */
  findByEmail(email: string): Promise<PrismaUser | null> {
    return this.prisma.user.findUnique({
      where: { email },
    })
  }

  /**
   * Updates an existing user
   * @param id - User ID to update
   * @param updateUserInput - Updated user data
   * @returns Updated user object
   * @throws BadRequestException if ID format is invalid, user not found, or email already exists
   */
  async update(id: string, updateUserInput: UpdateUserInput): Promise<PrismaUser> {
    // Validate UUID format
    if (!isValidUUID(id)) {
      throw new InvalidFormatException('ID', id)
    }

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      throw new ResourceNotFoundException('User', id)
    }

    try {
      // Hash password if it's being updated
      if (updateUserInput.password) {
        updateUserInput.password = await bcrypt.hash(updateUserInput.password, 10)
      }
      return await this.prisma.user.update({
        where: { id },
        data: updateUserInput,
      })
    } catch (error) {
      // Handle unique constraint error (P2002) for email
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        throw new DuplicateResourceException('Email')
      }
      throw error
    }
  }

  /**
   * Deletes a user by ID
   * @param id - User ID to delete
   * @returns Deleted user object
   * @throws BadRequestException if ID format is invalid or user not found
   */
  async remove(id: string): Promise<PrismaUser> {
    // Validate UUID format
    if (!isValidUUID(id)) {
      throw new InvalidFormatException('ID', id)
    }

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      throw new ResourceNotFoundException('User', id)
    }

    return this.prisma.user.delete({
      where: { id },
    })
  }
}
