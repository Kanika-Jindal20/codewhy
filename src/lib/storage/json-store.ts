import fs from 'fs';
import path from 'path';

function getDataDir(): string {
  return path.join(process.cwd(), 'data');
}

function ensureDataDir(): string {
  const dir = getDataDir();
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch {
    // Directory might already exist
  }
  return dir;
}

/**
 * Reads a JSON file from the data directory.
 * Returns defaultValue if file does not exist or fails to parse.
 */
export function readDataFile<T>(filename: string, defaultValue: T): T {
  try {
    const dir = ensureDataDir();
    const filePath = path.join(dir, filename);
    if (!fs.existsSync(filePath)) {
      return defaultValue;
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[storage] Could not read ${filename}, using default:`, err);
    return defaultValue;
  }
}

/**
 * Writes data directly to a JSON file in the data directory.
 */
export function writeDataFile<T>(filename: string, data: T): boolean {
  try {
    const dir = ensureDataDir();
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`[storage] Failed to write ${filename}:`, err);
    return false;
  }
}
