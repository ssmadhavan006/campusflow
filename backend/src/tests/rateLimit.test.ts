import { rateLimiter } from '../middleware/rateLimit.middleware';
import { Request, Response } from 'express';

describe('Rate Limiting Middleware Test', () => {
  it('should allow requests below limit and return 429 when limit is exceeded', () => {
    const middleware = rateLimiter({
      windowMs: 5000,
      max: 2,
      message: 'Too many requests.',
    });

    const next = jest.fn();
    const req = {
      ip: '192.168.1.100',
      socket: {},
    } as unknown as Request;

    const statusMock = jest.fn().mockReturnThis();
    const jsonMock = jest.fn();
    const res = {
      status: statusMock,
      json: jsonMock,
    } as unknown as Response;

    // Call 1
    middleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);

    // Call 2
    middleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(2);

    // Call 3 (Blocked)
    middleware(req, res, next);
    expect(statusMock).toHaveBeenCalledWith(429);
    expect(jsonMock).toHaveBeenCalledWith({
      status: 'fail',
      message: 'Too many requests.',
    });
    expect(next).toHaveBeenCalledTimes(2);
  });

});
