import { Field, InputType } from '@nestjs/graphql'
import { IsEmail, IsNotEmpty, MaxLength, MinLength } from 'class-validator'

@InputType()
export class CreateUserInput {
  @Field()
  @IsEmail({}, { message: 'Invalid email format' })
  @MaxLength(255, { message: 'Email must not exceed 255 characters' })
  email: string

  @Field()
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name: string

  @Field()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(100, { message: 'Password must not exceed 100 characters' })
  password: string
}
