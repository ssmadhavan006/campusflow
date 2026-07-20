import { describe, it, expect } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../modules/auth/auth.service';

const prisma = new PrismaClient();

describe('Refresh Token Rotation & Theft Prevention Test', () => {
  it('should rotate active tokens, block replay attempts, and revoke all sessions', async () => {
    const email = `test-sec-${Date.now()}@campusflow.com`;
    const name = 'Security Test User';
    const password = 'password123';

    const user = await AuthService.register({
      email,
      passwordHash: password,
      name,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });

    const loginRes = await AuthService.login(email, password);
    const t1 = loginRes.refreshToken;

    const t1Record = await prisma.refreshToken.findUnique({ where: { token: t1 } });
    expect(t1Record).toBeDefined();
    expect(t1Record?.revoked).toBe(false);

    const refreshRes = await AuthService.refresh(t1);
    const t2 = refreshRes.refreshToken;

    const t1RecordPost = await prisma.refreshToken.findUnique({ where: { token: t1 } });
    const t2RecordPost = await prisma.refreshToken.findUnique({ where: { token: t2 } });

    expect(t1RecordPost?.revoked).toBe(true);
    expect(t1RecordPost?.replacedByTokenId).toBe(t2RecordPost?.id);
    expect(t2RecordPost?.revoked).toBe(false);

    let attackFailed = false;
    try {
      await AuthService.refresh(t1);
    } catch (err: any) {
      attackFailed = true;
      expect(err.message).toContain('Security alert');
    }
    expect(attackFailed).toBe(true);

    const activeTokens = await prisma.refreshToken.findMany({
      where: { userId: user.id, revoked: false },
    });
    expect(activeTokens.length).toBe(0);

    const theftLogs = await prisma.auditLog.findMany({
      where: { userId: user.id, action: 'REFRESH_TOKEN_THEFT_DETECTED' },
    });
    expect(theftLogs.length).toBe(1);

    await prisma.user.delete({ where: { id: user.id } });
  });

});
