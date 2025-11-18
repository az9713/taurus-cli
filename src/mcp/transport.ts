/**
 * MCP Transport base class and implementations
 */

import { EventEmitter } from 'events';
import { JsonRpcRequest, JsonRpcResponse, JsonRpcNotification } from './types.js';

export abstract class McpTransport extends EventEmitter {
  protected nextId = 1;
  protected pendingRequests = new Map<string | number, {
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }>();

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract send(message: JsonRpcRequest | JsonRpcNotification): Promise<void>;

  async request(method: string, params?: any): Promise<any> {
    const id = this.nextId++;
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      this.send(request).catch((error) => {
        this.pendingRequests.delete(id);
        reject(error);
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request timeout: ${method}`));
        }
      }, 30000);
    });
  }

  notify(method: string, params?: any): Promise<void> {
    const notification: JsonRpcNotification = {
      jsonrpc: '2.0',
      method,
      params,
    };
    return this.send(notification);
  }

  protected handleMessage(message: JsonRpcResponse | JsonRpcNotification): void {
    // Handle response
    if ('id' in message && message.id !== undefined) {
      const response = message as JsonRpcResponse;
      const pending = this.pendingRequests.get(response.id);

      if (pending) {
        this.pendingRequests.delete(response.id);

        if (response.error) {
          pending.reject(new Error(response.error.message));
        } else {
          pending.resolve(response.result);
        }
      }
    }
    // Handle notification
    else {
      const notification = message as JsonRpcNotification;
      this.emit('notification', notification);
    }
  }
}
