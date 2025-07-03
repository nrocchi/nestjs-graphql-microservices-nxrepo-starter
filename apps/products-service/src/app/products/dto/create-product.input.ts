import { Field, Float, InputType, Int } from '@nestjs/graphql'
import { IsNotEmpty, IsNumber, IsPositive, IsUUID, MaxLength, Min } from 'class-validator'

@InputType()
export class CreateProductInput {
  @Field()
  @IsNotEmpty({ message: 'Product name is required' })
  @MaxLength(200, { message: 'Product name must not exceed 200 characters' })
  name: string

  @Field({ nullable: true })
  @MaxLength(1000, { message: 'Description must not exceed 1000 characters' })
  description?: string

  @Field(() => Float)
  @IsNumber({}, { message: 'Price must be a number' })
  @IsPositive({ message: 'Price must be positive' })
  price: number

  @Field()
  @IsNotEmpty({ message: 'SKU is required' })
  @MaxLength(50, { message: 'SKU must not exceed 50 characters' })
  sku: string

  @Field(() => Int)
  @IsNumber({}, { message: 'Stock must be a number' })
  @Min(0, { message: 'Stock cannot be negative' })
  stock: number

  @Field()
  @IsUUID('4', { message: 'Invalid user ID format' })
  userId: string
}
