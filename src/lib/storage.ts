import { put, list, del } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

// Check if we're in production (Vercel)
const isProduction = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

// Blob store token from environment
const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

/**
 * Ensures the directory exists for local file storage
 */
const ensureDirectory = (filePath: string) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

/**
 * Reads JSON data from storage (Blob in production, local file in development)
 */
export async function readJson<T>(fileName: string, defaultValue: T): Promise<T> {
  if (isProduction && BLOB_READ_WRITE_TOKEN) {
    return readFromBlob<T>(fileName, defaultValue);
  } else {
    return readFromFile<T>(fileName, defaultValue);
  }
}

/**
 * Writes JSON data to storage (Blob in production, local file in development)
 */
export async function writeJson<T>(fileName: string, data: T): Promise<void> {
  if (isProduction && BLOB_READ_WRITE_TOKEN) {
    await writeToBlob(fileName, data);
  } else {
    await writeToFile(fileName, data);
  }
}

// ============== BLOB STORAGE (Production) ==============

async function readFromBlob<T>(fileName: string, defaultValue: T): Promise<T> {
  try {
    // List blobs to find the file
    const { blobs } = await list({
      prefix: fileName,
      token: BLOB_READ_WRITE_TOKEN,
    });

    if (blobs.length === 0) {
      // File doesn't exist, create it with default value
      await writeToBlob(fileName, defaultValue);
      return defaultValue;
    }

    // Get the most recent blob
    const blob = blobs[0];
    const response = await fetch(blob.url);
    
    if (!response.ok) {
      console.error(`Error fetching blob: ${response.statusText}`);
      return defaultValue;
    }

    const text = await response.text();
    if (!text.trim()) {
      return defaultValue;
    }

    return JSON.parse(text) as T;
  } catch (error) {
    console.error(`Error reading from Blob ${fileName}:`, error);
    return defaultValue;
  }
}

async function writeToBlob<T>(fileName: string, data: T): Promise<void> {
  try {
    // First, delete existing blob with the same name
    const { blobs } = await list({
      prefix: fileName,
      token: BLOB_READ_WRITE_TOKEN,
    });

    for (const blob of blobs) {
      await del(blob.url, { token: BLOB_READ_WRITE_TOKEN });
    }

    // Upload new blob
    const jsonData = JSON.stringify(data, null, 2);
    await put(fileName, jsonData, {
      access: 'public',
      token: BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
    });
  } catch (error) {
    console.error(`Error writing to Blob ${fileName}:`, error);
    throw error;
  }
}

// ============== FILE STORAGE (Development) ==============

async function readFromFile<T>(fileName: string, defaultValue: T): Promise<T> {
  const filePath = path.join(process.cwd(), 'data', fileName);
  ensureDirectory(filePath);

  if (!fs.existsSync(filePath)) {
    await fs.promises.writeFile(filePath, JSON.stringify(defaultValue, null, 2), 'utf8');
    return defaultValue;
  }

  try {
    const data = await fs.promises.readFile(filePath, 'utf8');
    if (!data.trim()) {
      return defaultValue;
    }
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`Error reading or parsing ${filePath}:`, error);
    return defaultValue;
  }
}

async function writeToFile<T>(fileName: string, data: T): Promise<void> {
  const filePath = path.join(process.cwd(), 'data', fileName);
  ensureDirectory(filePath);
  await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}
