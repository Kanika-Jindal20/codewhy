/**
 * File-backed persistence for local data storage.
 * Safely guards against execution in browser / client-side bundles.
 */

function getFs() {
  if (typeof window !== 'undefined') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('fs');
  } catch {
    return null;
  }
}

function getPath() {
  if (typeof window !== 'undefined') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('path');
  } catch {
    return null;
  }
}

function getDataDir(): string | null {
  const path = getPath();
  if (!path) return null;
  return path.join(process.cwd(), 'data');
}

function ensureDataDir(): string | null {
  const fs = getFs();
  const dir = getDataDir();
  if (!fs || !dir) return null;
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  } catch {
    return null;
  }
}

/**
 * Reads a JSON file from the data directory.
 * Returns defaultValue if file does not exist or fails to parse.
 */
export function readDataFile<T>(filename: string, defaultValue: T): T {
  const fs = getFs();
  const path = getPath();
  const dir = ensureDataDir();
  if (!fs || !path || !dir) return defaultValue;

  try {
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
  const fs = getFs();
  const path = getPath();
  const dir = ensureDataDir();
  if (!fs || !path || !dir) return false;

  try {
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`[storage] Failed to write ${filename}:`, err);
    return false;
  }
}
