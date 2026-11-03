import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { env } from '../env.js';

export interface StoredFile {
  url: string;
  filename: string;
}

/**
 * Storage abstraction. The local driver writes to UPLOAD_DIR and is served from /uploads.
 * To use S3, implement this interface (put -> PutObject, remove -> DeleteObject, return the CDN/public URL)
 * and select it in `createStorage` via STORAGE_DRIVER.
 */
export interface StorageDriver {
  put(buffer: Buffer, originalName: string): Promise<StoredFile>;
  remove(url: string): Promise<void>;
}

export const uploadRoot = path.resolve(process.cwd(), env.UPLOAD_DIR);

class LocalStorage implements StorageDriver {
  async put(buffer: Buffer, originalName: string): Promise<StoredFile> {
    await fs.mkdir(uploadRoot, { recursive: true });
    const ext = path.extname(originalName).toLowerCase();
    const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    await fs.writeFile(path.join(uploadRoot, filename), buffer);
    return { url: `/uploads/${filename}`, filename };
  }

  async remove(url: string): Promise<void> {
    if (!url.startsWith('/uploads/') || url.startsWith('/uploads/seed/')) return;
    const target = path.join(uploadRoot, path.basename(url));
    await fs.rm(target, { force: true });
  }
}

export function createStorage(): StorageDriver {
  switch (env.STORAGE_DRIVER) {
    case 'local':
    default:
      return new LocalStorage();
  }
}

export const storage = createStorage();
