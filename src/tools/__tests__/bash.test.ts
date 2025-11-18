/**
 * Tests for Bash tool
 */

import { BashTool } from '../bash.js';

describe('BashTool', () => {
  let tool: BashTool;

  beforeEach(() => {
    tool = new BashTool();
  });

  it('should have correct name', () => {
    expect(tool.name).toBe('Bash');
  });

  it('should execute simple command', async () => {
    const result = await tool.execute({
      command: 'echo "hello world"',
    });

    expect(result.is_error).toBe(false);
    expect(result.content).toContain('hello world');
  });

  it('should handle command errors', async () => {
    const result = await tool.execute({
      command: 'exit 1',
    });

    expect(result.is_error).toBe(true);
    expect(result.content).toContain('Exit code 1');
  });

  it('should respect timeout', async () => {
    const result = await tool.execute({
      command: 'sleep 10',
      timeout: 100,
    });

    expect(result.is_error).toBe(true);
    expect(result.content).toContain('timed out');
  }, 10000);
});
