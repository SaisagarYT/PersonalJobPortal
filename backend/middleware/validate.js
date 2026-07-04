import { ZodError } from 'zod';

// Middleware to validate request data against a Zod schema
const validate = (schema) => {
  return (req, res, next) => {
    try {
      // Validate request body against schema
      const validated = schema.parse(req.body);
      // Replace req.body with validated & typed data
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Pass Zod error to error handler
        next(error);
      } else {
        next(error);
      }
    }
  };
};

// Validate query parameters
const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(error);
      } else {
        next(error);
      }
    }
  };
};

// Validate route parameters
const validateParams = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.params);
      req.params = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(error);
      } else {
        next(error);
      }
    }
  };
};

export { validate, validateQuery, validateParams };
