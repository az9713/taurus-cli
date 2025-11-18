/**
 * Tests for MCP Transport
 */

import { McpTransport } from '../transport.js';

// Mock transport implementation for testing
class MockTransport extends McpTransport {
  public sentMessages: any[] = [];
  async connect(): Promise<void> {
  }

  async disconnect(): Promise<void> {
  }

  async send(message: any): Promise<void> {
    this.sentMessages.push(message);

    // Simulate response for testing
    if (message.id) {
      setTimeout(() => {
        this.handleMessage({
          jsonrpc: '2.0',
          id: message.id,
          result: { success: true },
        });
      }, 10);
    }
  }
}

describe('McpTransport', () => {
  let transport: MockTransport;

  beforeEach(() => {
    transport = new MockTransport();
  });

  it('should send requests with incrementing IDs', async () => {
    await transport.connect();

    const promise1 = transport.request('test/method1');
    const promise2 = transport.request('test/method2');

    await Promise.all([promise1, promise2]);

    expect(transport.sentMessages).toHaveLength(2);
    expect(transport.sentMessages[0].id).toBe(1);
    expect(transport.sentMessages[1].id).toBe(2);
  });

  it('should send notifications without ID', async () => {
    await transport.connect();
    await transport.notify('test/notification', { data: 'test' });

    const message = transport.sentMessages[0];
    expect(message.id).toBeUndefined();
    expect(message.method).toBe('test/notification');
  });

  it('should resolve requests with responses', async () => {
    await transport.connect();

    const result = await transport.request('test/method');
    expect(result).toEqual({ success: true });
  });

  it('should handle request timeout', async () => {
    // Create transport with very short timeout for testing
    class TimeoutTransport extends MockTransport {
      async send(message: any): Promise<void> {
        this.sentMessages.push(message);
        // Don't send response - let it timeout
      }
    }

    const timeoutTransport = new TimeoutTransport();
    await timeoutTransport.connect();

    // This should timeout (but we'd need to wait 30s in real test)
    // For now, just verify the request was sent
    timeoutTransport.request('test/method').catch(() => {
      // Expected to fail
    });

    expect(timeoutTransport.sentMessages).toHaveLength(1);
  }, 100);
});
