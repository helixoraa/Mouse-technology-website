import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { env } from '../env.js';

export interface StoredFile {
  url: string;
  filename: string;
}

/**
 * Storage abstraction (STORAGE_DRIVER):
 *  - "local": writes to UPLOAD_DIR, served from /uploads (development, docker).
 *  - "blob":  Vercel Blob (serverless has no persistent disk). Public URLs are stored in Media rows.
 * To use S3, implement this interface (put -> PutObject, remove -> DeleteObject, return the public/CDN URL)
 * and select it in `createStorage`.
 */
export interface StorageDriver {
  put(buffer: Buffer, originalName: string, contentType?: string): Promise<StoredFile>;
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

/** Public Vercel Blob URLs look like https://<store-id>.public.blob.vercel-storage.com/<path>. */
export const isBlobUrl = (url: string) => {
  try {
    return new URL(url).hostname.endsWith('.blob.vercel-storage.com');
  } catch {
    return false;
  }
};

class VercelBlobStorage implements StorageDriver {
  private token = env.BLOB_READ_WRITE_TOKEN as string;

  async put(buffer: Buffer, originalName: string, contentType?: string): Promise<StoredFile> {
    const { put } = await import('@vercel/blob'); // loaded lazily: local/docker runs never need it
    const ext = path.extname(originalName).toLowerCase();
    const base =
      path
        .basename(originalName, ext)
        .replace(/[^a-z0-9-_]+/gi, '-')
        .slice(0, 60) || 'file';
    const blob = await put(`uploads/${base}${ext}`, buffer, {
      access: 'public',
      addRandomSuffix: true,
      contentType,
      token: this.token,
    });
    return { url: blob.url, filename: path.basename(blob.pathname) };
  }

  async remove(url: string): Promise<void> {
    if (!isBlobUrl(url)) return; // never touch anything that is not a Blob URL (e.g. /animations/*)
    const { del } = await import('@vercel/blob');
    await del(url, { token: this.token });
  }
}

export function createStorage(): StorageDriver {
  switch (env.STORAGE_DRIVER) {
    case 'blob':
      return new VercelBlobStorage();
    case 'local':
    default:
      return new LocalStorage();
  }
}

export const storage = createStorage();
