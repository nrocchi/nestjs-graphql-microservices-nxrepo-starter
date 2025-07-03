import { Module } from '@nestjs/common'
import { ProductsResolver } from './products.resolver'
import { UserResolver } from './user.resolver'
import { ProductsService } from './products.service'

@Module({
  providers: [ProductsResolver, UserResolver, ProductsService],
})
export class ProductsModule {}
