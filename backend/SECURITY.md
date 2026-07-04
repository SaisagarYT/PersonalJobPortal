# Security Implementation Documentation

## Overview

The backend now implements comprehensive security measures including:

- **Helmet.js** - Security headers
- **CORS** - Cross-Origin Resource Sharing control
- **Rate Limiting** - Protection against abuse
- **Request Logging** - Morgan for access logs
- **Input Validation** - Zod schemas
- **Error Sanitization** - Safe error messages in production

## Security Layers

```
Request
  ↓
Helmet (Security Headers)
  ↓
CORS (Origin Validation)
  ↓
Morgan (Request Logging)
  ↓
Rate Limiter (Abuse Protection)
  ↓
Body Parser (Size Limits)
  ↓
Input Validation (Zod)
  ↓
Controller → Service → Database
  ↓
Error Handler (Sanitized Responses)
  ↓
Response
```

## 1. Helmet.js - Security Headers

**Configuration:** `config/helmet.js`

### Enabled Protections:

#### Content Security Policy (CSP)

Prevents XSS attacks by controlling resource loading.

```javascript
{
  defaultSrc: ["'self'"],
  styleSrc: ["'self'", "'unsafe-inline'"],
  scriptSrc: ["'self'"],
  imgSrc: ["'self'", "data:", "https:"],
  // ... more directives
}
```

#### Strict Transport Security (HSTS)

Forces HTTPS connections for 1 year.

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

#### X-Frame-Options

Prevents clickjacking attacks.

```
X-Frame-Options: DENY
```

#### X-Content-Type-Options

Prevents MIME type sniffing.

```
X-Content-Type-Options: nosniff
```

#### Other Headers:

- `X-XSS-Protection: 1; mode=block` - XSS filter for older browsers
- `Referrer-Policy: strict-origin-when-cross-origin`
- Removes `X-Powered-By` header
- DNS prefetch control
- IE no-open protection

## 2. CORS Configuration

**Configuration:** `config/cors.js`

### Allowed Origins (Development):

- `http://localhost:3000` - React
- `http://localhost:5173` - Vite
- `http://localhost:8080` - Vue
- `http://localhost:4200` - Angular
- All localhost origins in development mode

### Production:

Add your production domains:

```javascript
const allowedOrigins = ['https://yourdomain.com', 'https://app.yourdomain.com'];
```

### Features:

- ✅ Credentials support (cookies, auth headers)
- ✅ Preflight request handling
- ✅ Exposed rate limit headers
- ✅ Dynamic origin validation
- ✅ Error handling for unauthorized origins

### Testing CORS:

```bash
# Valid origin
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS http://localhost:5000/api/v1/opportunities

# Invalid origin (should fail)
curl -H "Origin: http://evil.com" \
     -X GET http://localhost:5000/api/v1/opportunities
```

## 3. Rate Limiting

**Configuration:** `middleware/security.js`

### Rate Limiter Types:

#### 1. General API Limiter

Applied to all API routes.

- **Window:** 15 minutes
- **Max Requests:** 100 per IP
- **Applied To:** All `/api/*` routes
- **Skips:** Health check endpoints

#### 2. Authentication Limiter

For login/register endpoints (when implemented).

- **Window:** 15 minutes
- **Max Requests:** 5 per IP
- **Purpose:** Prevent brute force attacks

#### 3. Scraping Limiter

For Unstop scraping endpoints.

- **Window:** 1 minute
- **Max Requests:** 10 per IP
- **Applied To:**
  - `POST /api/v1/opportunities`
  - `POST /api/v1/wishlist/all`

#### 4. Write Limiter

For database write operations.

- **Window:** 1 minute
- **Max Requests:** 20 per IP
- **Applied To:**
  - `POST /api/v1/history`
  - `POST /api/v1/wishlist`
  - `DELETE /api/v1/wishlist`

### Rate Limit Headers:

```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1625247600
```

### Rate Limit Error Response:

```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again after 15 minutes"
}
```

### Customizing Rate Limits:

```javascript
// In middleware/security.js
const customLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // 50 requests per window
  message: {
    success: false,
    message: 'Custom rate limit message',
  },
});

// In your route
route.post('/endpoint', customLimiter, controller.handler);
```

## 4. Request Logging (Morgan)

**Configuration:** `config/logger.js`

### Development Mode:

Detailed, colorized logs with request body.

```
POST /api/v1/opportunities 200 123 ms - 1234 {"page":1,"pagination":18}
```

### Production Mode:

Standard Apache combined log format.

```
192.168.1.1 - - [04/Jul/2026:14:30:00 +0000] "POST /api/v1/opportunities HTTP/1.1" 200 1234 "https://example.com" "Mozilla/5.0..." 123.456 ms
```

### Features:

- ✅ Skips health check logging
- ✅ Sanitizes sensitive fields (password, token, apiKey)
- ✅ Custom response time token
- ✅ Request body logging (development only)

### Logging to File:

```javascript
import fs from 'fs';
import path from 'path';

// Create a write stream (append mode)
const accessLogStream = fs.createWriteStream(path.join('logs', 'access.log'), { flags: 'a' });

// Production logging to file
app.use(morgan('combined', { stream: accessLogStream }));
```

## 5. Request Body Size Limits

Prevents DoS attacks via large payloads.

```javascript
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```

## 6. Production Hardening

### Trust Proxy

When behind nginx/load balancer:

```javascript
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}
```

### Environment Variables

Add to `.env`:

```env
NODE_ENV=production
PORT=5000
```

## Security Best Practices

### 1. Secrets Management

✅ Using Infisical for secrets
✅ No hardcoded credentials
✅ `.env` in `.gitignore`

### 2. Input Validation

✅ Zod schemas for all inputs
✅ Type safety
✅ Sanitization

### 3. Error Handling

✅ No stack traces in production
✅ Generic error messages
✅ Detailed logs server-side

### 4. Database Security

✅ Parameterized queries (Supabase)
✅ Row-level security (Supabase feature)
✅ Connection pooling

### 5. API Security

✅ Rate limiting per endpoint
✅ CORS restrictions
✅ Request size limits

## Health Check Endpoints

### Basic Health Check

```bash
GET /
```

**Response:**

```json
{
  "success": true,
  "message": "Personal Job Portal API",
  "version": "1.0.0",
  "status": "healthy"
}
```

### Detailed Health Check

```bash
GET /health
```

**Response (Healthy):**

```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2026-07-04T14:30:00.000Z",
  "services": {
    "database": "healthy",
    "api": "healthy"
  }
}
```

**Response (Degraded):**

```json
{
  "success": false,
  "status": "degraded",
  "timestamp": "2026-07-04T14:30:00.000Z",
  "services": {
    "database": "unhealthy",
    "api": "healthy"
  }
}
```

## Monitoring & Alerts

### Recommended Setup:

1. **Uptime Monitoring** - UptimeRobot, Pingdom
2. **Error Tracking** - Sentry, Rollbar
3. **Performance Monitoring** - New Relic, DataDog
4. **Log Aggregation** - ELK Stack, Papertrail

### Key Metrics to Monitor:

- Request rate
- Error rate (5xx responses)
- Response time (p50, p95, p99)
- Rate limit hits
- Database connection pool
- Memory/CPU usage

## Testing Security

### 1. Test Rate Limiting

```bash
# Run 15 requests quickly
for i in {1..15}; do
  curl http://localhost:5000/api/v1/opportunities \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"page":1}'
  echo ""
done
```

### 2. Test CORS

```bash
# Should succeed
curl -H "Origin: http://localhost:3000" \
     http://localhost:5000/api/v1/opportunities

# Should fail
curl -H "Origin: http://malicious.com" \
     http://localhost:5000/api/v1/opportunities
```

### 3. Test Security Headers

```bash
curl -I http://localhost:5000/
```

Look for headers:

- `X-Content-Type-Options`
- `X-Frame-Options`
- `Strict-Transport-Security`
- `X-XSS-Protection`

### 4. Test Large Payload

```bash
# Should be rejected (over 10mb limit)
curl -X POST http://localhost:5000/api/v1/opportunities \
  -H "Content-Type: application/json" \
  -d '@large-file.json'
```

## Common Attack Scenarios & Mitigations

### 1. Brute Force Attack

**Mitigation:** Rate limiting (5 req/15min for auth)

### 2. DDoS Attack

**Mitigation:** Rate limiting + CDN (Cloudflare)

### 3. SQL Injection

**Mitigation:** Parameterized queries (Supabase ORM)

### 4. XSS Attack

**Mitigation:** CSP headers + input validation

### 5. CSRF Attack

**Mitigation:** CORS + SameSite cookies (when using sessions)

### 6. Clickjacking

**Mitigation:** X-Frame-Options: DENY

### 7. Man-in-the-Middle

**Mitigation:** HSTS + HTTPS only

## Production Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS (Let's Encrypt)
- [ ] Add production domains to CORS whitelist
- [ ] Configure `trust proxy` if behind load balancer
- [ ] Set up log rotation
- [ ] Configure monitoring & alerts
- [ ] Review rate limits for production traffic
- [ ] Enable database connection pooling
- [ ] Set up automated backups
- [ ] Configure firewall rules
- [ ] Review and update security headers
- [ ] Set up SSL certificate auto-renewal
- [ ] Configure graceful shutdown handling

## Additional Security Measures (Future)

### JWT Authentication

```javascript
import jwt from 'jsonwebtoken';

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    throw new UnauthorizedError('No token provided');
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    throw new UnauthorizedError('Invalid token');
  }
};
```

### API Key Authentication

```javascript
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    throw new UnauthorizedError('Invalid API key');
  }
  next();
};
```

### Request ID Tracking

```javascript
import { v4 as uuidv4 } from 'uuid';

app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});
```

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Node.js Security Checklist](https://github.com/goldbergyoni/nodebestpractices#6-security-best-practices)
