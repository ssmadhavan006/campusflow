import { Request, Response, NextFunction } from 'express';

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

const limiterStore = new Map<string, RateLimitInfo>();

// Periodic cleanup of stale entries every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [key, info] of limiterStore.entries()) {
    if (now > info.resetTime) {
      limiterStore.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS).unref();

const getClientIp = (req: Request): string => {
  return req.ip || req.socket?.remoteAddress || 'unknown-ip';
};

export const rateLimiter = (options: { windowMs: number; max: number; message: string; skipTestEnv?: boolean }) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (options.skipTestEnv && process.env.NODE_ENV === 'test') {
      return next();
    }

    const ip = getClientIp(req);
    const now = Date.now();
    const storeKey = `${ip}:${options.windowMs}`;

    let clientLimit = limiterStore.get(storeKey);

    if (!clientLimit || now > clientLimit.resetTime) {
      clientLimit = {
        count: 1,
        resetTime: now + options.windowMs,
      };
      limiterStore.set(storeKey, clientLimit);
      return next();
    }

    clientLimit.count += 1;

    if (clientLimit.count > options.max) {
      return res.status(429).json({
        status: 'fail',
        message: options.message,
      });
    }

    return next();
  };
};

export const authRateLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: 'Too many authentication attempts from this IP. Please try again after 1 minute.',
  skipTestEnv: true,
});

export const scanRateLimiter = rateLimiter({
  windowMs: 10 * 1000, // 10 seconds
  max: 10,
  message: 'Too many ticket scan attempts. Please slow down.',
  skipTestEnv: true,
});

export const writeRateLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: 'Too many write requests. Please try again after 1 minute.',
  skipTestEnv: true,
});

export const generalRateLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: 'Too many requests. Please try again after 1 minute.',
  skipTestEnv: true,
});
