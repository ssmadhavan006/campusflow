import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/db';
import { env } from '../../config/env';
import { Role } from '@prisma/client';
import { logAudit } from '../../utils/audit';

export class AuthService {
  static generateAccessToken(userId: string, email: string, role: Role) {
    return jwt.sign(
      { userId, email, role },
      env.JWT_SECRET,
      { expiresIn: '15m' }
    );
  }

  static generateRefreshTokenString() {
    return crypto.randomBytes(40).toString('hex');
  }

  static async register(data: {
    email: string;
    passwordHash: string;
    name: string;
    rollNumber?: string;
    department?: string;
    class?: string;
    section?: string;
    role?: Role;
  }) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          data.rollNumber ? { rollNumber: data.rollNumber } : {},
        ].filter((c) => Object.keys(c).length > 0) as any,
      },
    });

    if (existingUser) {
      throw new Error('User with this email or roll number already exists.');
    }

    const passwordHash = await bcrypt.hash(data.passwordHash, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        name: data.name,
        rollNumber: data.rollNumber || null,
        department: data.department || null,
        class: data.class || null,
        section: data.section || null,
        role: data.role || Role.STUDENT,
      },
    });

    await logAudit(user.id, 'USER_REGISTER', 'User', user.id, { role: user.role });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      class: user.class,
      section: user.section,
    };
  }

  static async login(email: string, passwordHash: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        clubMembers: {
          select: {
            clubId: true,
            role: true
          }
        }
      }
    });

    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const passwordMatch = await bcrypt.compare(passwordHash, user.passwordHash);
    if (!passwordMatch) {
      throw new Error('Invalid email or password.');
    }

    const accessToken = this.generateAccessToken(user.id, user.email, user.role);
    const refreshTokenString = this.generateRefreshTokenString();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: refreshTokenString,
        userId: user.id,
        expiresAt,
      },
    });

    await logAudit(user.id, 'USER_LOGIN', 'User', user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        rollNumber: user.rollNumber,
        department: user.department,
        class: user.class,
        section: user.section,
        clubMembers: user.clubMembers,
      },
      accessToken,
      refreshToken: refreshTokenString,
    };
  }

  static async logout(token: string) {
    const refreshTokenRecord = await prisma.refreshToken.findUnique({
      where: { token },
    });

    if (refreshTokenRecord) {
      await prisma.refreshToken.update({
        where: { id: refreshTokenRecord.id },
        data: { revoked: true },
      });
      await logAudit(refreshTokenRecord.userId, 'USER_LOGOUT', 'RefreshToken', refreshTokenRecord.id);
    }
  }

  static async refresh(token: string) {
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new Error('Invalid refresh token.');
    }

    if (tokenRecord.revoked || tokenRecord.replacedByTokenId || tokenRecord.expiresAt < new Date()) {
      await prisma.refreshToken.updateMany({
        where: { userId: tokenRecord.userId, revoked: false },
        data: { revoked: true },
      });

      await logAudit(
        tokenRecord.userId,
        'REFRESH_TOKEN_THEFT_DETECTED',
        'RefreshToken',
        tokenRecord.id,
        { token }
      );

      throw new Error('Security alert: Refresh token reuse detected. Access revoked.');
    }

    const user = tokenRecord.user;
    const newAccessToken = this.generateAccessToken(user.id, user.email, user.role);
    const newRefreshTokenString = this.generateRefreshTokenString();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const newRefreshTokenRecord = await prisma.refreshToken.create({
      data: {
        token: newRefreshTokenString,
        userId: user.id,
        expiresAt,
      },
    });

    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: {
        revoked: true,
        replacedByTokenId: newRefreshTokenRecord.id,
      },
    });

    await logAudit(user.id, 'REFRESH_TOKEN_ROTATE', 'RefreshToken', tokenRecord.id);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshTokenString,
    };
  }
}
