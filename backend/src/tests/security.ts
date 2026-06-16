import { PrismaClient } from '@prisma/client';
import { AuthService } from '../modules/auth/auth.service';

const prisma = new PrismaClient();

async function runSecurityTest() {
  console.log('[TEST] Starting Refresh Token Rotation & Theft Prevention Test...');

  const email = `test-sec-${Date.now()}@campusflow.com`;
  const name = 'Security Test User';
  const password = 'password123';

  console.log('[TEST] Registering user...');
  const user = await AuthService.register({
    email,
    passwordHash: password,
    name,
  });

  console.log('[TEST] Logging in (generating Token 1)...');
  const loginRes = await AuthService.login(email, password);
  const t1 = loginRes.refreshToken;

  const t1Record = await prisma.refreshToken.findUnique({ where: { token: t1 } });
  if (!t1Record || t1Record.revoked) {
    throw new Error('Initial token record should be active.');
  }

  console.log('[TEST] Rotating Token 1 to generate Token 2...');
  const refreshRes = await AuthService.refresh(t1);
  const t2 = refreshRes.refreshToken;

  const t1RecordPost = await prisma.refreshToken.findUnique({ where: { token: t1 } });
  const t2RecordPost = await prisma.refreshToken.findUnique({ where: { token: t2 } });

  console.log(`[TEST] Token 1 Revoked Status (Expected true): ${t1RecordPost?.revoked}`);
  console.log(`[TEST] Token 1 Replaced By Token ID (Expected matches Token 2 ID): ${t1RecordPost?.replacedByTokenId === t2RecordPost?.id}`);
  console.log(`[TEST] Token 2 Revoked Status (Expected false): ${t2RecordPost?.revoked}`);

  if (!t1RecordPost?.revoked || !t2RecordPost || t2RecordPost.revoked) {
    throw new Error('Token rotation state mismatch.');
  }

  console.log('[TEST] Simulating Replay Attack (requesting refresh using already-revoked Token 1)...');
  let attackFailed = false;
  try {
    await AuthService.refresh(t1);
  } catch (err: any) {
    attackFailed = true;
    console.log(`[TEST] Replay attempt successfully blocked. Error message: "${err.message}"`);
  }

  if (!attackFailed) {
    throw new Error('Security breach! Replayed refresh token was accepted.');
  }

  console.log('[TEST] Checking revocation of all user tokens...');
  const activeTokens = await prisma.refreshToken.findMany({
    where: { userId: user.id, revoked: false },
  });

  console.log(`[TEST] Active tokens remaining for user (Expected 0): ${activeTokens.length}`);

  const theftLogs = await prisma.auditLog.findMany({
    where: { userId: user.id, action: 'REFRESH_TOKEN_THEFT_DETECTED' },
  });
  console.log(`[TEST] Theft alert audit logs written (Expected 1): ${theftLogs.length}`);

  const success = activeTokens.length === 0 && theftLogs.length === 1;

  if (success) {
    console.log('[TEST SUCCESS] Token theft prevention mechanism works perfectly!');
  } else {
    console.error('[TEST FAILURE] Security check failed.');
  }

  console.log('[TEST] Cleaning up test database records...');
  await prisma.user.delete({ where: { id: user.id } });
  console.log('[TEST] Cleanup completed.');
  process.exit(success ? 0 : 1);
}

runSecurityTest().catch((err) => {
  console.error('[TEST FATAL] Security test crashed:', err);
  process.exit(1);
});
