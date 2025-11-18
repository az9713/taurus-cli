/**
 * Tests for file utilities
 */

import { ensureDir, fileExists, readFile, writeFile } from '../files.js';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('File utilities', () => {
  const testDir = join(tmpdir(), 'taurus-test-' + Date.now());

  afterAll(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true });
    } catch {
      // Ignore errors
    }
  });

  describe('ensureDir', () => {
    it('should create directory', async () => {
      const dir = join(testDir, 'test-dir');
      await ensureDir(dir);
      const exists = await fileExists(dir);
      expect(exists).toBe(true);
    });

    it('should not error if directory exists', async () => {
      const dir = join(testDir, 'existing-dir');
      await ensureDir(dir);
      await expect(ensureDir(dir)).resolves.not.toThrow();
    });
  });

  describe('fileExists', () => {
    it('should return true for existing file', async () => {
      const file = join(testDir, 'exists.txt');
      await ensureDir(testDir);
      await fs.writeFile(file, 'test');
      const exists = await fileExists(file);
      expect(exists).toBe(true);
    });

    it('should return false for non-existing file', async () => {
      const file = join(testDir, 'does-not-exist.txt');
      const exists = await fileExists(file);
      expect(exists).toBe(false);
    });
  });

  describe('readFile and writeFile', () => {
    it('should write and read file', async () => {
      const file = join(testDir, 'test.txt');
      const content = 'Hello, Taurus!';

      await writeFile(file, content);
      const readContent = await readFile(file);

      expect(readContent).toBe(content);
    });
  });
});
