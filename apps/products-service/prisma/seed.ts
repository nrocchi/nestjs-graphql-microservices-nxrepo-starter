import { PrismaClient } from '@prisma/client-products'
import { PrismaClient as UsersPrismaClient } from '@prisma/client-users'

const prisma = new PrismaClient()
const usersPrisma = new UsersPrismaClient({
  datasources: {
    db: {
      url:
        process.env.USERS_DATABASE_URL ||
        'postgresql://postgres:postgres@localhost:5432/users_db?schema=public',
    },
  },
})

const productNames = [
  'Laptop Pro',
  'Smartphone X',
  'Wireless Headphones',
  'Smart Watch',
  'Tablet Pro',
  'Gaming Console',
  'Bluetooth Speaker',
  'Digital Camera',
  'Fitness Tracker',
  'Power Bank',
  'USB-C Hub',
  'Mechanical Keyboard',
  'Gaming Mouse',
  'Monitor 4K',
  'Webcam HD',
  'External SSD',
  'Router WiFi 6',
  'Smart Home Hub',
  'Drone Mini',
  'VR Headset',
]

const productDescriptions = [
  'High-performance laptop for professionals',
  'Latest flagship smartphone with advanced features',
  'Premium noise-cancelling wireless headphones',
  'Fitness and health tracking smartwatch',
  'Powerful tablet for work and entertainment',
  'Next-gen gaming console with 4K support',
  'Portable speaker with amazing sound quality',
  'Professional DSLR camera for photography',
  'Track your fitness goals and health metrics',
  'Fast charging portable power bank',
  'Multi-port hub for all your devices',
  'RGB mechanical keyboard for gaming',
  'High-precision gaming mouse',
  'Ultra HD monitor for productivity',
  'High-definition webcam for video calls',
  'Fast external storage solution',
  'High-speed wireless router',
  'Control your smart home devices',
  'Compact drone with HD camera',
  'Immersive virtual reality experience',
]

async function main() {
  console.warn('🌱 Starting products seed...')

  // Clear existing data
  await prisma.product.deleteMany()

  // Get user IDs directly from users database
  let userIds: string[] = []

  try {
    console.warn('📡 Fetching users from users database...')
    const users = await usersPrisma.user.findMany({
      select: { id: true },
      orderBy: { email: 'asc' },
    })

    if (users.length > 0) {
      userIds = users.map((u) => u.id)
      console.warn(`✅ Found ${userIds.length} users in database`)
    } else {
      console.warn('⚠️  No users found in database, using fallback IDs...')
      // Fallback to deterministic IDs if no users exist
      userIds = Array.from(
        { length: 20 },
        (_, i) => `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`
      )
    }
  } catch (error) {
    console.error('❌ Error fetching users:', error)
    console.warn('⚠️  Using fallback IDs...')
    userIds = Array.from(
      { length: 20 },
      (_, i) => `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`
    )
  }

  // Create 20 products
  const products = []
  for (let i = 0; i < 20; i++) {
    const product = await prisma.product.create({
      data: {
        name: productNames[i],
        description: productDescriptions[i],
        price: Math.floor(Math.random() * 2000) + 50, // Prix entre 50 et 2050
        sku: `SKU-${String(i + 1).padStart(5, '0')}`,
        stock: Math.floor(Math.random() * 100) + 1, // Stock entre 1 et 100
        userId: userIds[Math.floor(Math.random() * userIds.length)], // Assigner aléatoirement à un utilisateur
      },
    })
    products.push(product)
    console.warn(`Created product: ${product.name} (${product.sku})`)
  }

  console.warn(`✅ Created ${products.length} products`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await usersPrisma.$disconnect()
  })
