import fs from 'fs';
import path from 'path';
import { env } from '../config/env';

export interface IStorageService {
  saveFile(key: string, data: Buffer): Promise<string>;
  deleteFile(key: string): Promise<void>;
  getFilePath(key: string): string;
}

class DiskStorageService implements IStorageService {
  private baseDir: string;

  constructor() {
    this.baseDir = path.resolve(env.UPLOAD_DIR);
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async saveFile(key: string, data: Buffer): Promise<string> {
    const filePath = path.join(this.baseDir, key);
    const dir = path.dirname(filePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await fs.promises.writeFile(filePath, data);
    return filePath;
  }

  async deleteFile(key: string): Promise<void> {
    const filePath = path.join(this.baseDir, key);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }

  getFilePath(key: string): string {
    return path.join(this.baseDir, key);
  }
}

export const storageService = new DiskStorageService();
