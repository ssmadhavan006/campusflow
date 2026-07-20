import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_access_token_key_12345',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_token_key_12345',
  JWT_VERIFICATION_SECRET: process.env.JWT_VERIFICATION_SECRET || 'super_secret_verification_key_12345',
  QR_SECRET: process.env.QR_SECRET || 'super_secret_qr_generation_key_12345',
  DISABLE_AUTO_OD_GENERATION: process.env.DISABLE_AUTO_OD_GENERATION === 'true',
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
    : ['http://localhost:5173'],
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:5000',
  // Comma-separated emails bootstrapped as ADMIN on first registration/seed only.
  ADMIN_EMAILS: (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
};

if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'super_secret_access_token_key_12345') {
    throw new Error('JWT_SECRET must be configured with a secure value in production');
  }
  if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET === 'super_secret_refresh_token_key_12345') {
    throw new Error('JWT_REFRESH_SECRET must be configured with a secure value in production');
  }
  if (!process.env.JWT_VERIFICATION_SECRET || process.env.JWT_VERIFICATION_SECRET === 'super_secret_verification_key_12345') {
    throw new Error('JWT_VERIFICATION_SECRET must be configured with a secure value in production');
  }
  if (!process.env.QR_SECRET || process.env.QR_SECRET === 'super_secret_qr_generation_key_12345') {
    throw new Error('QR_SECRET must be configured with a secure value in production');
  }
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new Error('GOOGLE_CLIENT_ID must be configured in production');
  }
} else {
  if (!process.env.JWT_SECRET) {
    console.warn('[ENV WARNING] JWT_SECRET is not set. Using default development secret.');
  }
  if (!process.env.JWT_REFRESH_SECRET) {
    console.warn('[ENV WARNING] JWT_REFRESH_SECRET is not set. Using default development secret.');
  }
  if (!process.env.JWT_VERIFICATION_SECRET) {
    console.warn('[ENV WARNING] JWT_VERIFICATION_SECRET is not set. Using default development secret.');
  }
  if (!process.env.QR_SECRET) {
    console.warn('[ENV WARNING] QR_SECRET is not set. Using default development secret.');
  }
  if (!process.env.FRONTEND_URL) {
    console.warn('[ENV WARNING] FRONTEND_URL is not set. Using default development URL.');
  }
  if (!process.env.BACKEND_URL) {
    console.warn('[ENV WARNING] BACKEND_URL is not set. Using default development URL.');
  }
}
