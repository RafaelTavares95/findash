import fs from 'fs';
import path from 'path';

export const ensureDirectory = (filePath: string) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

export async function readJson<T>(filePath: string, defaultValue: T): Promise<T> {
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

export async function writeJson<T>(filePath: string, data: T): Promise<void> {
  ensureDirectory(filePath);
  await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}
