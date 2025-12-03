import { Request, Response, NextFunction } from 'express';
import { ZodSchema, AnyZodObject } from 'zod';

/**
 * Middleware factory for request body validation using Zod safeParse
 */
export const validate = (schema: AnyZodObject | ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({ error: result.error.format() });
      return;
    }

    req.body = result.data;
    next();
  };
};

/**
 * Validate only request body (alias for validate)
 */
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({ error: result.error.format() });
      return;
    }

    req.body = result.data;
    next();
  };
};

/**
 * Validate only query parameters
 */
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      res.status(400).json({ error: result.error.format() });
      return;
    }

    req.query = result.data;
    next();
  };
};

/**
 * Validate only route parameters
 */
export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      res.status(400).json({ error: result.error.format() });
      return;
    }

    req.params = result.data;
    next();
  };
};
