import crypto from 'crypto';
import { env } from '../config/env';

export const generateQRToken = (eventId: string, registrationId: string): string => {
  const timestamp = Date.now().toString();
  const payload = `${eventId}.${registrationId}.${timestamp}`;
  const signature = crypto
    .createHmac('sha256', env.JWT_SECRET)
    .update(payload)
    .digest('hex');
  return `${payload}.${signature}`;
};

export const verifyQRToken = (qrToken: string): { eventId: string; registrationId: string; timestamp: number } | null => {
  try {
    const parts = qrToken.split('.');
    if (parts.length !== 4) return null;

    const [eventId, registrationId, timestamp, signature] = parts;
    const payload = `${eventId}.${registrationId}.${timestamp}`;
    const expectedSignature = crypto
      .createHmac('sha256', env.JWT_SECRET)
      .update(payload)
      .digest('hex');

    if (signature !== expectedSignature) return null;

    return {
      eventId,
      registrationId,
      timestamp: parseInt(timestamp, 10),
    };
  } catch (error) {
    return null;
  }
};
