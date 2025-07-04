import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateProductInput } from './dto/create-product.input'
import { UpdateProductInput } from './dto/update-product.input'
import { isValidUUID } from '@libs/utils'
import {
  DuplicateResourceException,
  InvalidFormatException,
  ResourceNotFoundException,
} from '@libs/exceptions'
import type { Product as PrismaProduct } from '@prisma/client-products'

/**
 * Service responsible for managing product operations.
 * This service is part of the products microservice in a GraphQL Federation architecture.
 * It handles all CRUD operations for products and provides methods to resolve federated relationships.
 */
@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Creates a new product
   * Note: In a federated architecture, we store only the userId reference.
   * The actual user data is resolved through federation when needed.
   * @param createProductInput - Product data for creation
   * @returns Created product object
   * @throws BadRequestException if userId format is invalid or SKU already exists
   */
  async create(createProductInput: CreateProductInput): Promise<PrismaProduct> {
    // Validate UUID format for userId
    if (!isValidUUID(createProductInput.userId)) {
      throw new InvalidFormatException('user ID', createProductInput.userId)
    }

    try {
      return await this.prisma.product.create({
        data: createProductInput,
      })
    } catch (error) {
      // Handle unique constraint error (P2002) for SKU
      if (error.code === 'P2002' && error.meta?.target?.includes('sku')) {
        throw new DuplicateResourceException('SKU')
      }
      throw error
    }
  }

  /**
   * Retrieves all products from the database
   * @returns Array of all products
   */
  findAll(): Promise<PrismaProduct[]> {
    return this.prisma.product.findMany()
  }

  /**
   * Finds a single product by ID
   * This method is used by both direct queries and federation reference resolvers
   * @param id - Product ID (must be valid UUID)
   * @returns Product object or null if not found
   * @throws BadRequestException if ID format is invalid
   */
  findOne(id: string): Promise<PrismaProduct | null> {
    // Validate UUID format
    if (!isValidUUID(id)) {
      throw new InvalidFormatException('ID', id)
    }

    return this.prisma.product.findUnique({
      where: { id },
    })
  }

  /**
   * Finds all products belonging to a specific user
   * This method is crucial for GraphQL Federation - it allows the products service
   * to resolve the 'products' field on the User type from the users service
   * @param userId - User ID to filter products
   * @returns Array of products for the given user
   * @throws BadRequestException if userId format is invalid
   */
  findByUser(userId: string): Promise<PrismaProduct[]> {
    // Validate UUID format
    if (!isValidUUID(userId)) {
      throw new InvalidFormatException('user ID', userId)
    }

    return this.prisma.product.findMany({
      where: { userId },
    })
  }

  /**
   * Updates an existing product
   * Note: When updating userId, we only validate the format, not if the user exists.
   * In a federated architecture, the user service is the source of truth for user existence.
   * @param id - Product ID to update
   * @param updateProductInput - Updated product data
   * @returns Updated product object
   * @throws BadRequestException if ID format is invalid, product not found, or SKU already exists
   */
  async update(id: string, updateProductInput: UpdateProductInput): Promise<PrismaProduct> {
    // Validate UUID format
    if (!isValidUUID(id)) {
      throw new InvalidFormatException('ID', id)
    }

    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      throw new ResourceNotFoundException('Product', id)
    }

    // If updating userId, validate its format
    if (updateProductInput.userId && !isValidUUID(updateProductInput.userId)) {
      throw new InvalidFormatException('user ID', updateProductInput.userId)
    }

    try {
      return await this.prisma.product.update({
        where: { id },
        data: updateProductInput,
      })
    } catch (error) {
      // Handle unique constraint error (P2002) for SKU
      if (error.code === 'P2002' && error.meta?.target?.includes('sku')) {
        throw new DuplicateResourceException('SKU')
      }
      throw error
    }
  }

  /**
   * Deletes a product by ID
   * @param id - Product ID to delete
   * @returns Deleted product object
   * @throws BadRequestException if ID format is invalid or product not found
   */
  async remove(id: string): Promise<PrismaProduct> {
    // Validate UUID format
    if (!isValidUUID(id)) {
      throw new InvalidFormatException('ID', id)
    }

    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      throw new ResourceNotFoundException('Product', id)
    }

    return this.prisma.product.delete({
      where: { id },
    })
  }
}
