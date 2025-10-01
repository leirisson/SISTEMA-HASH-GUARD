import { Role } from '@prisma/client';

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  username: string;
  role: Role;
  iat?: number; // Issued at
  exp?: number; // Expiration time
}