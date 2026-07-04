# Input Validation & Error Handling Documentation

## Overview

The backend now implements comprehensive input validation and centralized error handling using **Zod** for schema validation and custom error classes for consistent error responses.

## Architecture

```
Request → Validation Middleware → Controller → Service → Database
                ↓ (on error)
          Error Handler Middleware
                ↓
          Formatted Error Response
```

## Components

### 1. Custom Error Classes (`utils/errors.js`)

**Available Error Types:**

- `AppError` - Base error class
- `ValidationError` - 400 - Invalid request data
- `NotFoundError` - 404 - Resource not found
- `UnauthorizedError` - 401 - Authentication required
- `ConflictError` - 409 - Resource already exists
- `InternalServerError` - 500 - Server errors

**Usage Example:**

```javascript
import { NotFoundError, ValidationError } from '../utils/errors.js';

// In your controller/service
if (!user) {
  throw new NotFoundError('User not found');
}

if (!isValid) {
  throw new ValidationError('Invalid input data');
}
```

### 2. Validation Middleware (`middleware/validate.js`)

**Available Validators:**

- `validate(schema)` - Validates `req.body`
- `validateQuery(schema)` - Validates `req.query`
- `validateParams(schema)` - Validates `req.params`

**Usage in Routes:**

```javascript
import { validate } from '../middleware/validate.js';
import { mySchema } from '../validators/my.validator.js';

route.post('/endpoint', validate(mySchema), controller.handler);
```

### 3. Error Handler Middleware (`middleware/errorHandler.js`)

**Features:**

- Centralized error handling
- Consistent error response format
- Automatic Zod error formatting
- PostgreSQL error handling (unique violations, foreign keys)
- Development vs Production error details
- 404 handler for undefined routes

**Error Response Format:**

```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    // Optional: validation errors
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "stack": "..." // Only in development
}
```

### 4. Validation Schemas

#### Opportunity Schemas (`validators/opportunity.validator.js`)

**fetchOpportunitiesSchema**

```javascript
{
  page: number (optional, default: 1),
  pagination: number (optional, default: 18, max: 100),
  role: string (optional, default: "ai-engineer"),
  userType: string (optional, default: "students")
}
```

**saveOpportunitySchema**

```javascript
{
  external_id: string | number (required),
  title: string (required),
  short_url: string (url, optional),
  company: {
    name: string (required),
    logo: string (url, optional)
  },
  description: string (optional),
  status: string (optional),
  work: array (optional),
  filters: object (optional),
  skills: array (optional),
  location: array (optional),
  job_detail: object (optional),
  type: string (optional),
  timing: string (optional),
  payment_type: string (optional),
  end_date: string (optional),
  approved_date: string (optional),
  register_count: number (optional)
}
```

#### Wishlist Schemas (`validators/wishlist.validator.js`)

**saveWishlistSchema**

```javascript
{
  user_id: string | number (required),
  opportunity_id: string | number (required)
}
```

**removeWishlistSchema**

```javascript
{
  user_id: string | number (required),
  opportunity_id: string | number (required)
}
```

**displayWishlistSchema**

```javascript
{
  id: string | number(required);
}
```

## Updated API Endpoints

### 1. POST `/api/v1/opportunities`

Fetch opportunities from Unstop with validation.

**Request Body:**

```json
{
  "page": 1,
  "pagination": 18,
  "role": "ai-engineer",
  "userType": "students"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "totalOpportunities": 18,
  "jobs": [...]
}
```

**Error Response (400):**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "pagination",
      "message": "Number must be less than or equal to 100"
    }
  ]
}
```

### 2. POST `/api/v1/history`

Save opportunity to database with full validation.

**Request Body:**

```json
{
  "external_id": "123456",
  "title": "AI Engineer Internship",
  "company": {
    "name": "TechCorp",
    "logo": "https://example.com/logo.png"
  },
  "description": "Job description..."
  // ... other fields
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Opportunity saved successfully"
}
```

### 3. POST `/api/v1/wishlist`

Add item to wishlist.

**Request Body:**

```json
{
  "user_id": "user123",
  "opportunity_id": "opp456"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Item added to wishlist successfully"
}
```

**Error Response (409):**

```json
{
  "success": false,
  "message": "Resource already exists"
}
```

### 4. DELETE `/api/v1/wishlist`

Remove item from wishlist.

**Request Body:**

```json
{
  "user_id": "user123",
  "opportunity_id": "opp456"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Item removed from wishlist successfully"
}
```

### 5. POST `/api/v1/wishlist/all`

Display wishlist item details.

**Request Body:**

```json
{
  "id": "123456"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "title": "...",
    "company_name": "..."
    // ... opportunity details
  }
}
```

**Error Response (404):**

```json
{
  "success": false,
  "message": "Opportunity not found or failed to fetch details"
}
```

## Controller Updates

All controllers now:

1. Accept `next` parameter for error forwarding
2. Use validated data from `req.body` (already validated by middleware)
3. Return consistent success responses with `success: true`
4. Forward all errors to error handler via `next(err)`

## Testing Validation

### Valid Request

```bash
curl -X POST http://localhost:5000/api/v1/opportunities \
  -H "Content-Type: application/json" \
  -d '{
    "page": 1,
    "pagination": 20,
    "role": "web-development",
    "userType": "students"
  }'
```

### Invalid Request (Validation Error)

```bash
curl -X POST http://localhost:5000/api/v1/opportunities \
  -H "Content-Type: application/json" \
  -d '{
    "page": -1,
    "pagination": 200
  }'
```

Expected Response:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "page",
      "message": "Number must be greater than 0"
    },
    {
      "field": "pagination",
      "message": "Number must be less than or equal to 100"
    }
  ]
}
```

### 404 Error

```bash
curl -X GET http://localhost:5000/api/v1/nonexistent
```

Expected Response:

```json
{
  "success": false,
  "message": "Route GET /api/v1/nonexistent not found"
}
```

## Adding New Validators

### Step 1: Create Schema

```javascript
// validators/user.validator.js
import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});
```

### Step 2: Apply in Route

```javascript
// routes/user.route.js
import { validate } from '../middleware/validate.js';
import { createUserSchema } from '../validators/user.validator.js';

route.post('/users', validate(createUserSchema), userController.createUser);
```

### Step 3: Update Controller

```javascript
// controllers/user.controller.js
const createUser = async (req, res, next) => {
  try {
    const userData = req.body; // Already validated
    const user = await userService.create(userData);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    });
  } catch (err) {
    next(err); // Forward to error handler
  }
};
```

## Best Practices

1. **Always use `next(err)`** instead of manual error responses in controllers
2. **Define schemas** for all endpoints, even if optional fields
3. **Use appropriate error classes** for different error types
4. **Add field-level validation messages** in Zod schemas
5. **Return consistent response format** with `success` field
6. **Test validation** with both valid and invalid data

## Environment Variables

Set `NODE_ENV=production` to hide stack traces in error responses:

```bash
NODE_ENV=production npm start
```

## Benefits

✅ **Type Safety** - Zod provides runtime type checking
✅ **Consistent Errors** - All errors follow the same format
✅ **Better DX** - Clear validation messages for debugging
✅ **Security** - Prevents invalid data from reaching database
✅ **Maintainability** - Centralized validation logic
✅ **API Documentation** - Schemas serve as documentation
