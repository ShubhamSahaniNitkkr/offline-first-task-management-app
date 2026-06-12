import type { NextFunction, Request, Response } from 'express';
import type { Env } from '../config/env.js';
import { verifyToken } from '../lib/jwt.js';
import { AppError } from '../lib/errors.js';

export interface AuthenticatedRequest extends Request {
  userId: string;
  userEmail: string;
  userName: string;
}

export function getAuthReq(req: Request): AuthenticatedRequest {
  return req as AuthenticatedRequest;
}

export function authMiddleware(env: Env) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return next(new AppError(401, 'UNAUTHORIZED', 'Missing or invalid authorization header'));
    }

    try {
      const token = header.slice(7);
      const payload = verifyToken(env, token);
      (req as AuthenticatedRequest).userId = payload.sub;
      (req as AuthenticatedRequest).userEmail = payload.email;
      (req as AuthenticatedRequest).userName = payload.name;
      next();
    } catch {
      next(new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token'));
    }
  };
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  console.error('Unhandled error:', err);
  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}
