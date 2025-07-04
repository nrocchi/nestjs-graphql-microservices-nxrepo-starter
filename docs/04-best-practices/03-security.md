# Security Best Practices

This guide covers security best practices for the NestJS GraphQL Microservices architecture, focusing on defensive security measures.

## Table of Contents

- [Authentication & Authorization](#authentication--authorization)
- [Input Validation & Sanitization](#input-validation--sanitization)
- [GraphQL Security](#graphql-security)
- [Database Security](#database-security)
- [API Security](#api-security)
- [Infrastructure Security](#infrastructure-security)
- [Dependency Security](#dependency-security)
- [Monitoring & Auditing](#monitoring--auditing)
- [Security Checklist](#security-checklist)

## Authentication & Authorization

### JWT Implementation

```typescript
// libs/auth/src/lib/jwt.strategy.ts
import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
      algorithms: ['HS256'], // Specify allowed algorithms
    })
  }

  async validate(payload: any) {
    // Minimal data in token
    return { userId: payload.sub, email: payload.email, roles: payload.roles }
  }
}
```

### Role-Based Access Control (RBAC)

```typescript
// libs/auth/src/lib/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ])
    
    if (!requiredRoles) {
      return true
    }
    
    const { user } = context.switchToHttp().getRequest()
    return requiredRoles.some((role) => user.roles?.includes(role))
  }
}

// Usage in resolver
@Roles('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Mutation(() => User)
async deleteUser(@Args('id') id: string) {
  return this.usersService.delete(id)
}
```

### Password Security

```typescript
// libs/auth/src/lib/password.service.ts
import * as bcrypt from 'bcryptjs'
import { Injectable } from '@nestjs/common'

@Injectable()
export class PasswordService {
  private readonly rounds = 12 // Adjust based on performance needs

  async hash(password: string): Promise<string> {
    // Validate password strength
    this.validatePasswordStrength(password)
    return bcrypt.hash(password, this.rounds)
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  private validatePasswordStrength(password: string): void {
    const minLength = 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*]/.test(password)

    if (password.length < minLength) {
      throw new Error('Password must be at least 8 characters long')
    }

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      throw new Error('Password must contain uppercase, lowercase, and numbers')
    }

    // Check against common passwords
    if (this.isCommonPassword(password)) {
      throw new Error('Password is too common')
    }
  }

  private isCommonPassword(password: string): boolean {
    const commonPasswords = ['password', '12345678', 'qwerty', 'admin']
    return commonPasswords.some(common => 
      password.toLowerCase().includes(common)
    )
  }
}
```

### Session Management

```typescript
// Secure session configuration
@Injectable()
export class SessionService {
  private readonly sessionStore = new Map<string, SessionData>()
  private readonly sessionTimeout = 30 * 60 * 1000 // 30 minutes

  async createSession(userId: string): Promise<string> {
    const sessionId = this.generateSecureToken()
    const expiresAt = Date.now() + this.sessionTimeout
    
    this.sessionStore.set(sessionId, {
      userId,
      createdAt: Date.now(),
      expiresAt,
      lastActivity: Date.now()
    })

    // Clean expired sessions periodically
    this.cleanExpiredSessions()
    
    return sessionId
  }

  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  private cleanExpiredSessions(): void {
    const now = Date.now()
    for (const [id, session] of this.sessionStore.entries()) {
      if (session.expiresAt < now) {
        this.sessionStore.delete(id)
      }
    }
  }
}
```

## Input Validation & Sanitization

### DTO Validation

```typescript
import { IsEmail, IsString, Length, Matches, IsUUID } from 'class-validator'
import { Transform } from 'class-transformer'

export class CreateUserInput {
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string

  @IsString()
  @Length(2, 50)
  @Transform(({ value }) => value.trim())
  @Matches(/^[a-zA-Z\s'-]+$/, {
    message: 'Name can only contain letters, spaces, hyphens, and apostrophes'
  })
  name: string

  @IsString()
  @Length(8, 128)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message: 'Password must contain uppercase, lowercase, number, and special character'
    }
  )
  password: string
}

// Global validation pipe
app.useGlobalPipes(new ValidationPipe({
  whitelist: true, // Strip unknown properties
  forbidNonWhitelisted: true, // Throw error on unknown properties
  transform: true, // Auto-transform types
  transformOptions: {
    enableImplicitConversion: false // Explicit conversions only
  }
}))
```

### SQL Injection Prevention

```typescript
// Using Prisma (automatically parameterized)
async findByEmail(email: string) {
  // Safe - Prisma handles parameterization
  return this.prisma.user.findUnique({
    where: { email }
  })
}

// If using raw SQL, always parameterize
async searchUsers(searchTerm: string) {
  // Safe - using parameterized query
  return this.prisma.$queryRaw`
    SELECT * FROM "User" 
    WHERE name ILIKE ${`%${searchTerm}%`}
    LIMIT 10
  `
}

// Never do this
async unsafeSearch(term: string) {
  // DANGER: SQL injection vulnerability
  return this.prisma.$queryRawUnsafe(
    `SELECT * FROM "User" WHERE name LIKE '%${term}%'`
  )
}
```

### XSS Prevention

```typescript
import DOMPurify from 'isomorphic-dompurify'

@Injectable()
export class SanitizationService {
  sanitizeHtml(input: string): string {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: []
    })
  }

  sanitizeForGraphQL(input: string): string {
    // Remove potential GraphQL injection attempts
    return input
      .replace(/[{}]/g, '') // Remove braces
      .replace(/\$/g, '') // Remove dollar signs
      .replace(/\.\./g, '') // Remove path traversal
  }

  escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
  }
}
```

## GraphQL Security

### Query Depth Limiting

```typescript
import depthLimit from 'graphql-depth-limit'

GraphQLModule.forRoot({
  validationRules: [
    depthLimit(5, { 
      ignore: ['__schema', '__type'] // Allow introspection queries
    })
  ],
  playground: process.env.NODE_ENV !== 'production',
  introspection: process.env.NODE_ENV !== 'production',
})
```

### Query Complexity Analysis

```typescript
import costAnalysis from 'graphql-cost-analysis'

GraphQLModule.forRoot({
  validationRules: [
    costAnalysis({
      maximumCost: 1000,
      defaultCost: 1,
      variables: {},
      createError: (max, actual) => {
        return new Error(
          `Query validation error: Cost ${actual} exceeds maximum cost ${max}`
        )
      },
      onComplete: (cost) => {
        console.log(`Query cost: ${cost}`)
      }
    })
  ]
})
```

### Rate Limiting

```typescript
import { ThrottlerModule } from '@nestjs/throttler'

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60, // Time window in seconds
      limit: 10, // Number of requests
      skipIf: (context) => {
        // Skip rate limiting for authenticated admin users
        const request = context.switchToHttp().getRequest()
        return request.user?.roles?.includes('admin')
      }
    })
  ]
})

// Custom rate limits for specific operations
@Throttle(3, 60) // 3 requests per minute
@Mutation(() => User)
async resetPassword(@Args('email') email: string) {
  // Password reset logic
}
```

### Field-Level Security

```typescript
@ObjectType()
export class User {
  @Field(() => ID)
  id: string

  @Field()
  email: string

  @Field()
  name: string

  // Never expose sensitive fields
  // @Field() // DON'T DO THIS
  password: string

  @Field({ nullable: true })
  @Authorized(['admin']) // Only admins can see this field
  lastLoginIp?: string

  @Field(() => [String])
  @Authorized() // Only authenticated users
  roles: string[]
}
```

## Database Security

### Connection Security

```env
# Use SSL for database connections
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public&sslmode=require"

# Separate read/write connections
DATABASE_URL_READ="postgresql://readonly_user:pass@host:5432/db"
DATABASE_URL_WRITE="postgresql://write_user:pass@host:5432/db"
```

### Data Encryption

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

@Injectable()
export class EncryptionService {
  private algorithm = 'aes-256-gcm'
  private key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex')

  encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    const iv = randomBytes(16)
    const cipher = createCipheriv(this.algorithm, this.key, iv)
    
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const tag = cipher.getAuthTag()
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    }
  }

  decrypt(encrypted: string, iv: string, tag: string): string {
    const decipher = createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(iv, 'hex')
    )
    
    decipher.setAuthTag(Buffer.from(tag, 'hex'))
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }
}
```

### Audit Logging

```typescript
@Injectable()
export class AuditService {
  async logDataAccess(
    userId: string,
    resource: string,
    action: string,
    metadata?: any
  ) {
    await this.prisma.auditLog.create({
      data: {
        userId,
        resource,
        action,
        metadata: metadata ? JSON.stringify(metadata) : null,
        ipAddress: this.getClientIp(),
        userAgent: this.getUserAgent(),
        timestamp: new Date()
      }
    })
  }

  // Log sensitive operations
  @LogAccess('User', 'READ_SENSITIVE')
  async getUserWithSensitiveData(id: string) {
    // Implementation
  }
}
```

## API Security

### CORS Configuration

```typescript
app.enableCors({
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || []
    
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) return callback(null, true)
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
})
```

### Security Headers

```typescript
import helmet from 'helmet'

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}))
```

### API Key Management

```typescript
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    private cryptoService: CryptoService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const apiKey = request.headers['x-api-key']
    
    if (!apiKey) {
      throw new UnauthorizedException('API key required')
    }

    // Validate API key format
    if (!this.isValidApiKeyFormat(apiKey)) {
      throw new UnauthorizedException('Invalid API key format')
    }

    // Check against hashed keys in database
    const hashedKey = await this.cryptoService.hash(apiKey)
    const validKey = await this.prisma.apiKey.findFirst({
      where: { 
        keyHash: hashedKey,
        active: true,
        expiresAt: { gt: new Date() }
      }
    })

    if (!validKey) {
      throw new UnauthorizedException('Invalid API key')
    }

    // Log API key usage
    await this.logApiKeyUsage(validKey.id)
    
    return true
  }

  private isValidApiKeyFormat(key: string): boolean {
    // Example: sk_live_xxxxxxxxxxxxxxxx
    return /^sk_(test|live)_[a-zA-Z0-9]{32}$/.test(key)
  }
}
```

## Infrastructure Security

### Environment Variables

```typescript
// libs/config/src/lib/config.validation.ts
import * as Joi from 'joi'

export const configValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .required(),
  
  DATABASE_URL: Joi.string()
    .pattern(/^postgresql:\/\//)
    .required(),
  
  JWT_SECRET: Joi.string()
    .min(32)
    .required(),
  
  ENCRYPTION_KEY: Joi.string()
    .hex()
    .length(64) // 32 bytes in hex
    .required(),
  
  ALLOWED_ORIGINS: Joi.string()
    .pattern(/^https:\/\//)
    .required(),
})

// Validate on startup
ConfigModule.forRoot({
  validationSchema: configValidationSchema,
  validationOptions: {
    abortEarly: false,
  }
})
```

### Secrets Management

```typescript
// Use AWS Secrets Manager in production
@Injectable()
export class SecretsService {
  private client = new SecretsManagerClient({ region: 'us-east-1' })

  async getSecret(secretName: string): Promise<string> {
    try {
      const response = await this.client.send(
        new GetSecretValueCommand({ SecretId: secretName })
      )
      
      return response.SecretString || ''
    } catch (error) {
      console.error('Failed to retrieve secret:', error)
      throw new Error('Secret retrieval failed')
    }
  }

  // Cache secrets to reduce API calls
  @Memoize({ ttl: 300000 }) // 5 minutes
  async getCachedSecret(secretName: string): Promise<string> {
    return this.getSecret(secretName)
  }
}
```

## Dependency Security

### Automated Scanning

```json
// package.json
{
  "scripts": {
    "security:check": "npm audit --audit-level=moderate",
    "security:fix": "npm audit fix",
    "security:snyk": "snyk test",
    "security:owasp": "dependency-check --scan . --format JSON --out dependency-check-report.json"
  }
}
```

### GitHub Actions Security Workflow

```yaml
# .github/workflows/security.yml
name: Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * *' # Daily

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
      
      - name: Run npm audit
        run: npm audit --audit-level=moderate
      
      - name: Run CodeQL
        uses: github/codeql-action/analyze@v2
      
      - name: Run Trivy
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
```

## Monitoring & Auditing

### Security Event Monitoring

```typescript
@Injectable()
export class SecurityMonitoringService {
  private readonly events = new EventEmitter()

  async logSecurityEvent(event: SecurityEvent) {
    // Log to persistent storage
    await this.prisma.securityEvent.create({
      data: {
        type: event.type,
        severity: event.severity,
        userId: event.userId,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        details: event.details,
        timestamp: new Date()
      }
    })

    // Alert on critical events
    if (event.severity === 'CRITICAL') {
      this.events.emit('critical-security-event', event)
    }

    // Send to SIEM
    await this.sendToSiem(event)
  }

  // Monitor suspicious activities
  async checkSuspiciousActivity(userId: string) {
    const recentEvents = await this.prisma.securityEvent.count({
      where: {
        userId,
        type: 'FAILED_LOGIN',
        timestamp: { gte: new Date(Date.now() - 3600000) } // Last hour
      }
    })

    if (recentEvents > 5) {
      await this.logSecurityEvent({
        type: 'ACCOUNT_LOCKOUT',
        severity: 'HIGH',
        userId,
        details: 'Too many failed login attempts'
      })
    }
  }
}
```

### Compliance Logging

```typescript
@Injectable()
export class ComplianceLogger {
  async logDataProcessing(operation: DataOperation) {
    await this.prisma.dataProcessingLog.create({
      data: {
        userId: operation.userId,
        dataType: operation.dataType,
        purpose: operation.purpose,
        legalBasis: operation.legalBasis,
        timestamp: new Date(),
        // For GDPR compliance
        retention: operation.retentionPeriod,
        dataSubjects: operation.affectedUsers
      }
    })
  }

  async logDataExport(userId: string, exportedData: string[]) {
    await this.prisma.dataExportLog.create({
      data: {
        userId,
        exportedData,
        timestamp: new Date(),
        // Hash for integrity verification
        checksum: this.calculateChecksum(exportedData)
      }
    })
  }
}
```

## Security Checklist

### Development Phase
- [ ] Input validation on all endpoints
- [ ] Output encoding for all responses
- [ ] Authentication required for sensitive operations
- [ ] Authorization checks for all resources
- [ ] Rate limiting configured
- [ ] SQL injection prevention verified
- [ ] XSS protection implemented
- [ ] CSRF protection enabled
- [ ] Security headers configured
- [ ] Dependency vulnerabilities scanned

### Pre-Production
- [ ] Security testing completed
- [ ] Penetration testing performed
- [ ] Code security review done
- [ ] Secrets removed from code
- [ ] Environment variables validated
- [ ] SSL/TLS certificates ready
- [ ] Backup encryption tested
- [ ] Audit logging functional
- [ ] Monitoring alerts configured
- [ ] Incident response plan ready

### Production
- [ ] HTTPS enforced everywhere
- [ ] Security headers active
- [ ] Rate limiting operational
- [ ] Monitoring active
- [ ] Alerts configured
- [ ] Backups encrypted
- [ ] Access logs enabled
- [ ] Security patches automated
- [ ] Compliance requirements met
- [ ] Regular security audits scheduled

## Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
- [GraphQL Security](https://www.apollographql.com/docs/apollo-server/security/authentication/)
- [NestJS Security](https://docs.nestjs.com/security/helmet)

Remember: Security is not a one-time task but an ongoing process. Regular reviews and updates are essential.