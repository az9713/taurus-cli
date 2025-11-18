/**
 * MCP Stdio Transport - Communication via stdin/stdout
 */

import { spawn, ChildProcess } from 'child_process';
import { McpTransport } from './transport.js';
import { JsonRpcRequest, JsonRpcNotification } from './types.js';
import { logger } from '../utils/logger.js';

export class StdioTransport extends McpTransport {
  private process: ChildProcess | null = null;
  private buffer = '';

  constructor(
    private command: string,
    private args: string[] = [],
    private env: Record<string, string> = {}
  ) {
    super();
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.process = spawn(this.command, this.args, {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: { ...process.env, ...this.env },
        });

        this.process.stdout?.on('data', (data) => {
          this.handleData(data);
        });

        this.process.stderr?.on('data', (data) => {
          logger.debug(`MCP stderr: ${data}`);
        });

        this.process.on('error', (error) => {
          logger.error(`MCP process error: ${error.message}`);
          this.emit('error', error);
          reject(error);
        });

        this.process.on('exit', (code) => {
          logger.debug(`MCP process exited with code ${code}`);
          this.emit('disconnect');
        });

        // Give process time to start
        setTimeout(() => {
          if (this.process && !this.process.killed) {
            resolve();
          } else {
            reject(new Error('Process failed to start'));
          }
        }, 100);
      } catch (error) {
        reject(error);
      }
    });
  }

  async disconnect(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }

  async send(message: JsonRpcRequest | JsonRpcNotification): Promise<void> {
    if (!this.process || !this.process.stdin) {
      throw new Error('Not connected');
    }

    const json = JSON.stringify(message);
    this.process.stdin.write(json + '\n');
  }

  private handleData(data: Buffer): void {
    this.buffer += data.toString();

    // Process complete messages (newline-delimited JSON)
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim()) {
        try {
          const message = JSON.parse(line);
          this.handleMessage(message);
        } catch (error) {
          logger.error(`Failed to parse MCP message: ${line}`);
        }
      }
    }
  }
}
