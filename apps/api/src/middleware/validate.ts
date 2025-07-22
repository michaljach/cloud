import type { Request, Response, NextFunction } from 'express'
import type { ZodSchema } from 'zod'
import { BadRequestError } from 'routing-controllers'

/**
 * Express middleware to validate request bodies using a Zod schema.
 *
 * @param {ZodSchema<any>} schema - The Zod schema to validate the request body against.
 * @returns {(req: Request, res: Response, next: NextFunction) => void} Middleware function that validates req.body and throws a BadRequestError if validation fails.
 *
 * @example
 *   import { z } from 'zod';
 *   const schema = z.object({ name: z.string() });
 *   app.post('/route', validate(schema), handler);
 */
export function validate(schema: ZodSchema<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      throw new BadRequestError(result.error.message)
    }
    req.body = result.data
    next()
  }
}
