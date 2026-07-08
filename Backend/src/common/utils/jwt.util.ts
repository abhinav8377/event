import jwt from 'jsonwebtoken';

const SECRET = (): string => process.env.JWT_SECRET || 'dev-secret';

export const signToken = (payload: Record<string, unknown>): string =>
  jwt.sign(payload, SECRET(), { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'] });

export const verifyToken = (token: string): jwt.JwtPayload =>
  jwt.verify(token, SECRET()) as jwt.JwtPayload;
