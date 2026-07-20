import request from 'supertest';
import app from '../app';
import { prisma } from '../config/db';

describe('Google OAuth Login Integration Test', () => {
  const originalFetch = global.fetch;

  afterAll(async () => {
    global.fetch = originalFetch;
    await prisma.user.deleteMany({
      where: {
        email: { endsWith: '@srmist.edu.in' }
      },
    });
  });

  it('should allow google login with any email domain', async () => {
    // 1. Gmail domain login
    const validEmail = `student-${Date.now()}@gmail.com`;
    global.fetch = jest.fn().mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          email: validEmail,
          email_verified: 'true',
          name: 'Regular Google User',
          aud: '845315933534-lcbj5lqb8ockg20d9v3en75665lja6bl.apps.googleusercontent.com',
        })
      })
    ) as any;

    const successRes = await request(app)
      .post('/api/auth/google-login')
      .send({ token: 'mocked_id_token' });

    expect(successRes.status).toBe(200);
    expect(successRes.body.data.user.email).toBe(validEmail);
    expect(successRes.body.data.isNewUser).toBe(true);

    // Clean up
    await prisma.user.deleteMany({
      where: { email: validEmail },
    });
  });
});
