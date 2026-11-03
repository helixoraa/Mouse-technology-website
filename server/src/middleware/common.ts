import type { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodError, type ZodTypeAny, type z } from 'zod';
import { isProd } from '../env.js';

/** Wrap async handlers so rejected promises reach the error handler. */
export const wrap =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Validate req.body / req.query / req.params with zod; the parsed result replaces the original. */
export const validate =
  (schemas: { body?: ZodTypeAny; query?: ZodTypeAny; params?: ZodTypeAny }): RequestHandler =>
  (req, _res, next) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) Object.defineProperty(req, 'query', { value: schemas.query.parse(req.query), writable: true });
      if (schemas.params) req.params = schemas.params.parse(req.params) as typeof req.params;
      next();
    } catch (err) {
      next(err);
    }
  };

export const idParams = (zod: typeof z) => zod.object({ id: zod.string().min(1) });

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Validation failed', details: err.flatten() });
  }
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  const code = (err as { code?: string })?.code;
  if (code === 'P2025') return res.status(404).json({ error: 'Not found' });
  if (code === 'P2002') return res.status(409).json({ error: 'A record with that unique value already exists' });
  if (code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File too large (max 5MB)' });
  console.error(err);
  res.status(500).json({ error: isProd ? 'Internal server error' : String((err as Error)?.message ?? err) });
};
