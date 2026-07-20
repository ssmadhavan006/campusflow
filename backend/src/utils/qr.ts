import crypto from 'crypto';
import { env } from '../config/env';

export const generateQRToken = (eventId: string, registrationId: string): string => {
  const timestamp = Date.now().toString();
  const payload = `${eventId}.${registrationId}.${timestamp}`;
  const signature = crypto
    .createHmac('sha256', env.QR_SECRET)
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
      .createHmac('sha256', env.QR_SECRET)
      .update(payload)
      .digest('hex');

    if (signature !== expectedSignature) return null;

    const parsedTimestamp = parseInt(timestamp, 10);
    const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
    if (Date.now() - parsedTimestamp > MAX_AGE_MS) return null;
    if (parsedTimestamp - Date.now() > 5 * 60 * 1000) return null; // 5 min clock drift allowance

    return {
      eventId,
      registrationId,
      timestamp: parsedTimestamp,
    };
  } catch (error) {
    return null;
  }
};
