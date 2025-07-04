import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common'

export class ResourceNotFoundException extends HttpException {
  constructor(resource: string, id: string) {
    super(`${resource} with ID ${id} not found`, HttpStatus.NOT_FOUND)
  }
}

export class DuplicateResourceException extends HttpException {
  constructor(field: string, value?: string) {
    const message = value ? `${field} '${value}' already exists` : `${field} already exists`
    super(message, HttpStatus.CONFLICT)
  }
}

export class InvalidFormatException extends BadRequestException {
  constructor(field: string, value: string) {
    super(`Invalid ${field} format: ${value}`)
  }
}
