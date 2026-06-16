import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_access_token_key_12345',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_token_key_12345',
  DISABLE_AUTO_OD_GENERATION: process.env.DISABLE_AUTO_OD_GENERATION === 'true',
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
};
