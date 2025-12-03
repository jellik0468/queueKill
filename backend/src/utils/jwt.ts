import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';
import { JwtPayload } from '../types';

/**
 * Sign a JWT token with HS256 algorithm and 7-day expiration
 */
export function signToken(payload: JwtPayload): string {
  const options: SignOptions = {
    algorithm: 'HS256',
    expiresIn: '7d',
  };

  return jwt.sign(payload, config.jwt.secret, options);
}

/**
 * Generate an access token (uses config-based expiration)
 */
export function generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  const options: SignOptions = {
    algorithm: 'HS256',
    expiresIn: config.jwt.accessExpiration,
  };

  return jwt.sign(payload, config.jwt.secret, options);
}

/**
 * Generate a refresh token
 */
export function generateRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  const options: SignOptions = {
    algorithm: 'HS256',
    expiresIn: config.jwt.refreshExpiration,
  };

  return jwt.sign(payload, config.jwt.secret, options);
}

/**
 * Verify and decode a token
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.secret) as JwtPayload;
}

/**
 * Decode a token without verification (for debugging)
 */
export function decodeToken(token: string): JwtPayload | null {
  const decoded = jwt.decode(token);
  return decoded as JwtPayload | null;
}

/**
 * Calculate expiration date from duration string
 */
export function getExpirationDate(duration: string): Date {
  const now = new Date();
  const match = duration.match(/^(\d+)([smhd])$/);

  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      now.setSeconds(now.getSeconds() + value);
      break;
    case 'm':
      now.setMinutes(now.getMinutes() + value);
      break;
    case 'h':
      now.setHours(now.getHours() + value);
      break;
    case 'd':
      now.setDate(now.getDate() + value);
      break;
  }

  return now;
}

