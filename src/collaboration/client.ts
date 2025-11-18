/**
 * Collaboration Client
 *
 * Client-side handler for collaborative sessions
 */

import { EventEmitter } from 'events';
import {
  CollaborativeSession,
  CollaborativeMessage,
  SyncEvent,
  JoinSessionRequest
} from './types.js';

export class CollaborationClient extends EventEmitter {
  private currentSession: CollaborativeSession | null = null;
  private userId: string;
  private userName: string;
  private connected: boolean = false;

  constructor(userId: string, userName: string) {
    super();
    this.userId = userId;
    this.userName = userName;
  }

  /**
   * Join a collaborative session
   */
  async joinSession(sessionId: string): Promise<void> {
    const request: JoinSessionRequest = {
      sessionId,
      userId: this.userId,
      userName: this.userName
    };

    // In a real implementation, this would connect to a WebSocket server
    // For now, we'll emit a join request event
    this.emit('join-request', request);
    this.connected = true;
  }

  /**
   * Leave the current session
   */
  leaveSession(): void {
    if (!this.currentSession) return;

    this.emit('leave-session', {
      sessionId: this.currentSession.id,
      userId: this.userId
    });

    this.currentSession = null;
    this.connected = false;
  }

  /**
   * Send a chat message
   */
  sendMessage(content: string): void {
    if (!this.currentSession) return;

    this.emit('message', {
      sessionId: this.currentSession.id,
      userId: this.userId,
      content,
      type: 'chat'
    });
  }

  /**
   * Update cursor position
   */
  updateCursor(file: string, line: number, column: number): void {
    if (!this.currentSession) return;

    this.emit('cursor-update', {
      sessionId: this.currentSession.id,
      userId: this.userId,
      file,
      line,
      column
    });
  }

  /**
   * Handle sync event from server
   */
  handleSyncEvent(event: SyncEvent): void {
    switch (event.type) {
      case 'user-joined':
        this.emit('user-joined', event.data.user);
        break;

      case 'user-left':
        this.emit('user-left', event.data.userName);
        break;

      case 'message':
        this.emit('message-received', event.data.message);
        break;

      case 'cursor-move':
        this.emit('cursor-moved', {
          userId: event.userId,
          ...event.data
        });
        break;

      case 'file-change':
        this.emit('file-changed', event.data);
        break;

      case 'tool-call':
        this.emit('tool-executed', event.data);
        break;
    }
  }

  /**
   * Set current session
   */
  setSession(session: CollaborativeSession): void {
    this.currentSession = session;
  }

  /**
   * Get current session
   */
  getSession(): CollaborativeSession | null {
    return this.currentSession;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get other users in session
   */
  getOtherUsers(): any[] {
    if (!this.currentSession) return [];

    return Array.from(this.currentSession.users.values())
      .filter(user => user.id !== this.userId);
  }
}
