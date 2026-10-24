import fs from 'fs';
import path from 'path';
import os from 'os';

function getLocalDataDir(): string {
  return path.join(process.cwd(), 'data');
}

function getTmpDataDir(): string {
  return path.join(os.tmpdir(), 'codewhy-data');
}

function ensureDir(dir: string): void {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch {
    // Directory might already exist or read-only
  }
}

/**
 * Reads a JSON file from either /tmp or local data directory.
 * Returns defaultValue if file does not exist or fails to parse.
 */
export function readDataFile<T>(filename: string, defaultValue: T): T {
  // 1. Check tmp directory first (where serverless writes land)
  try {
    const tmpPath = path.join(getTmpDataDir(), filename);
    if (fs.existsSync(tmpPath)) {
      const raw = fs.readFileSync(tmpPath, 'utf8');
      return JSON.parse(raw) as T;
    }
  } catch {
    // Ignore and fallback
  }

  // 2. Check local data directory (persisted bundled files or local dev)
  try {
    const localPath = path.join(getLocalDataDir(), filename);
    if (fs.existsSync(localPath)) {
      const raw = fs.readFileSync(localPath, 'utf8');
      return JSON.parse(raw) as T;
    }
  } catch {
    // Ignore and fallback
  }

  return defaultValue;
}

/**
 * Writes data directly to a JSON file in tmp and local data directory.
 */
export function writeDataFile<T>(filename: string, data: T): boolean {
  let written = false;

  // Always write to tmpdir (writable in Vercel / AWS Lambda and local)
  try {
    const tmpDir = getTmpDataDir();
    ensureDir(tmpDir);
    const tmpPath = path.join(tmpDir, filename);
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
    written = true;
  } catch (err) {
    console.warn(`[storage] Could not write to tmpdir for ${filename}:`, err);
  }

  // Also try local data directory (succeeds in local dev, fails safely on serverless)
  try {
    const localDir = getLocalDataDir();
    ensureDir(localDir);
    const localPath = path.join(localDir, filename);
    fs.writeFileSync(localPath, JSON.stringify(data, null, 2), 'utf8');
    written = true;
  } catch {
    // Silently ignore in read-only serverless environment
  }

  return written;
}
