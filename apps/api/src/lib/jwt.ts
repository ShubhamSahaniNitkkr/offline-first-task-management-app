import jwt from 'jsonwebtoken';
import type { Env } from '../config/env.js';
import type { User } from '@oftmp/shared';

interface TokenPayload {
  sub: string;
  email: string;
  name: string;
}

export function signAccessToken(env: Env, user: User): string {
  const payload: TokenPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
  };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

export function signRefreshToken(env: Env, user: User): string {
  return jwt.sign({ sub: user.id }, env.JWT_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
  });
}

export function verifyToken(env: Env, token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}
