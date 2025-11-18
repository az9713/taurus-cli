/**
 * MCP HTTP/SSE Transport - Communication via HTTP with Server-Sent Events
 */

import { McpTransport } from './transport.js';
import { JsonRpcRequest, JsonRpcNotification } from './types.js';
import fetch from 'node-fetch';
import EventSource from 'eventsource';
import { logger } from '../utils/logger.js';

export class HttpTransport extends McpTransport {
  private eventSource: EventSource | null = null;
  private sessionId: string | null = null;

  constructor(
    private url: string,
    private headers: Record<string, string> = {}
  ) {
    super();
  }

  async connect(): Promise<void> {
    // Create SSE connection for receiving messages
    const sseUrl = `${this.url}/sse`;
    this.eventSource = new EventSource(sseUrl, {
      headers: this.headers,
    });

    return new Promise((resolve, reject) => {
      this.eventSource!.onopen = () => {
        logger.debug('MCP SSE connection opened');
        resolve();
      };

      this.eventSource!.onerror = (error: any) => {
        logger.error(`MCP SSE error: ${error}`);
        this.emit('error', error);
        reject(error);
      };

      this.eventSource!.onmessage = (event: any) => {
        try {
          const message = JSON.parse(event.data);

          // Handle session initialization
          if (message.sessionId) {
            this.sessionId = message.sessionId;
          }

          this.handleMessage(message);
        } catch (error) {
          logger.error(`Failed to parse MCP SSE message: ${event.data}`);
        }
      };
    });
  }

  async disconnect(): Promise<void> {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.sessionId = null;
  }

  async send(message: JsonRpcRequest | JsonRpcNotification): Promise<void> {
    const response = await fetch(`${this.url}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.sessionId ? { 'X-Session-Id': this.sessionId } : {}),
        ...this.headers,
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // For requests, the response comes via SSE
    // For notifications, we're done
  }
}
