import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/db';
import { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: Role;
        name: string;
        rollNumber?: string | null;
        department?: string | null;
        class?: string | null;
        section?: string | null;
        clubMembers?: {
          clubId: string;
          role: string;
        }[];
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ status: 'fail', message: 'Authentication required. Token is missing.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string; email: string; role: Role };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        rollNumber: true,
        department: true,
        class: true,
        section: true,
        clubMembers: {
          select: {
            clubId: true,
            role: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ status: 'fail', message: 'User belonging to this token no longer exists.' });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ status: 'fail', message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ status: 'fail', message: 'Invalid or malformed token.' });
  }
};

export const authorize = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ status: 'fail', message: 'Authentication required.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: 'Forbidden: You do not have permissions to perform this action.'
      });
    }
    return next();
  };
};
