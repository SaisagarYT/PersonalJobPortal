const errorHandler = (err, req, res, _next) => {
  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = null;

  // Log error for debugging
  console.error('Error:', {
    name: err.name,
    message: err.message,
    statusCode,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    statusCode = 400;
    message = 'Validation failed';
    errors =
      err.errors?.map((e) => ({
        field: e.path?.join('.') || 'unknown',
        message: e.message,
      })) || [];
  }

  // Handle Supabase errors
  if (err.code && err.code.startsWith('23')) {
    // PostgreSQL error codes
    if (err.code === '23505') {
      // Unique violation
      statusCode = 409;
      message = 'Resource already exists';
    } else if (err.code === '23503') {
      // Foreign key violation
      statusCode = 400;
      message = 'Invalid reference - related resource not found';
    }
  }

  // Response format
  const response = {
    success: false,
    message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      originalError: err.name,
    }),
  };

  res.status(statusCode).json(response);
};

// 404 handler for undefined routes
const notFoundHandler = (req, res, _next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
};

// Async error wrapper to catch errors in async route handlers
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export { errorHandler, notFoundHandler, asyncHandler };
