/**
 * File system utilities
 */

import { promises as fs } from 'fs';
import { dirname } from 'path';

export async function ensureDir(path: string): Promise<void> {
  try {
    await fs.mkdir(path, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

export async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

export async function readFile(path: string): Promise<string> {
  return await fs.readFile(path, 'utf-8');
}

export async function writeFile(path: string, content: string): Promise<void> {
  await ensureDir(dirname(path));
  await fs.writeFile(path, content, 'utf-8');
}

export async function readJsonFile<T>(path: string): Promise<T> {
  const content = await readFile(path);
  return JSON.parse(content);
}

export async function writeJsonFile(path: string, data: any): Promise<void> {
  await writeFile(path, JSON.stringify(data, null, 2));
}
