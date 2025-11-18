/**
 * Collaboration Server
 *
 * Handles real-time collaboration using WebSockets
 */

import { EventEmitter } from 'events';
import {
  CollaborativeSession,
  CollaborativeUser,
  CollaborativeMessage,
  SessionPermissions,
  SyncEvent,
  JoinSessionRequest,
  JoinSessionResponse
} from './types.js';

export class CollaborationServer extends EventEmitter {
  private sessions: Map<string, CollaborativeSession> = new Map();
  private userColors: string[] = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
  ];
  private colorIndex: number = 0;

  /**
   * Create a new collaborative session
   */
  createSession(
    name: string,
    creatorId: string,
    permissions: Partial<SessionPermissions> = {}
  ): CollaborativeSession {
    const sessionId = this.generateSessionId();

    const defaultPermissions: SessionPermissions = {
      maxUsers: 5,
      allowFileEdit: true,
      allowToolExecution: true,
      requireApproval: false,
      recordSession: true,
      ...permissions
    };

    const creator: CollaborativeUser = {
      id: creatorId,
      name: 'Creator',
      role: 'admin',
      color: this.getNextColor(),
      joinedAt: new Date(),
      lastActivity: new Date()
    };

    const session: CollaborativeSession = {
      id: sessionId,
      name,
      createdBy: creatorId,
      createdAt: new Date(),
      users: new Map([[creatorId, creator]]),
      messages: [],
      sharedFiles: new Set(),
      permissions: defaultPermissions
    };

    this.sessions.set(sessionId, session);

    // Log creation
    this.addSystemMessage(sessionId, `Session "${name}" created`);

    return session;
  }

  /**
   * Join an existing session
   */
  joinSession(request: JoinSessionRequest): JoinSessionResponse {
    const session = this.sessions.get(request.sessionId);

    if (!session) {
      return {
        success: false,
        error: 'Session not found'
      };
    }

    // Check if session is full
    if (session.users.size >= session.permissions.maxUsers) {
      return {
        success: false,
        error: 'Session is full'
      };
    }

    // Check if user already in session
    if (session.users.has(request.userId)) {
      return {
        success: true,
        session,
        shareLink: this.generateShareLink(request.sessionId)
      };
    }

    // Add user to session
    const user: CollaborativeUser = {
      id: request.userId,
      name: request.userName,
      role: 'editor', // New users default to editor
      color: this.getNextColor(),
      joinedAt: new Date(),
      lastActivity: new Date()
    };

    session.users.set(request.userId, user);

    // Broadcast user joined event
    this.broadcastEvent({
      type: 'user-joined',
      sessionId: request.sessionId,
      userId: request.userId,
      data: { user },
      timestamp: new Date()
    });

    this.addSystemMessage(request.sessionId, `${request.userName} joined the session`);

    return {
      success: true,
      session,
      shareLink: this.generateShareLink(request.sessionId)
    };
  }

  /**
   * Leave a session
   */
  leaveSession(sessionId: string, userId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const user = session.users.get(userId);
    if (!user) return;

    session.users.delete(userId);

    // Broadcast user left event
    this.broadcastEvent({
      type: 'user-left',
      sessionId,
      userId,
      data: { userName: user.name },
      timestamp: new Date()
    });

    this.addSystemMessage(sessionId, `${user.name} left the session`);

    // Delete session if empty
    if (session.users.size === 0) {
      this.sessions.delete(sessionId);
    }
  }

  /**
   * Add a message to the session
   */
  addMessage(
    sessionId: string,
    userId: string,
    content: string,
    type: CollaborativeMessage['type'] = 'chat'
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const user = session.users.get(userId);
    if (!user) return;

    const message: CollaborativeMessage = {
      id: this.generateMessageId(),
      sessionId,
      userId,
      userName: user.name,
      type,
      content,
      timestamp: new Date()
    };

    session.messages.push(message);

    // Update user activity
    user.lastActivity = new Date();

    // Broadcast message event
    this.broadcastEvent({
      type: 'message',
      sessionId,
      userId,
      data: { message },
      timestamp: new Date()
    });
  }

  /**
   * Update cursor position
   */
  updateCursor(
    sessionId: string,
    userId: string,
    file: string,
    line: number,
    column: number
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const user = session.users.get(userId);
    if (!user) return;

    user.cursorPosition = { file, line, column };
    user.lastActivity = new Date();

    // Broadcast cursor move event
    this.broadcastEvent({
      type: 'cursor-move',
      sessionId,
      userId,
      data: { file, line, column },
      timestamp: new Date()
    });
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): CollaborativeSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * List all active sessions
   */
  listSessions(): CollaborativeSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Update user role
   */
  updateUserRole(sessionId: string, userId: string, role: CollaborativeUser['role']): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const user = session.users.get(userId);
    if (!user) return false;

    user.role = role;

    this.addSystemMessage(sessionId, `${user.name} is now ${role}`);

    return true;
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId: string): {
    userCount: number;
    messageCount: number;
    duration: number;
    activeUsers: number;
  } | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const now = new Date();
    const duration = now.getTime() - session.createdAt.getTime();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const activeUsers = Array.from(session.users.values()).filter(
      user => user.lastActivity > fiveMinutesAgo
    ).length;

    return {
      userCount: session.users.size,
      messageCount: session.messages.length,
      duration: duration / 1000, // in seconds
      activeUsers
    };
  }

  /**
   * Broadcast event to all users in a session
   */
  private broadcastEvent(event: SyncEvent): void {
    this.emit('sync-event', event);
  }

  /**
   * Add system message
   */
  private addSystemMessage(sessionId: string, content: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const message: CollaborativeMessage = {
      id: this.generateMessageId(),
      sessionId,
      userId: 'system',
      userName: 'System',
      type: 'system',
      content,
      timestamp: new Date()
    };

    session.messages.push(message);

    this.broadcastEvent({
      type: 'message',
      sessionId,
      userId: 'system',
      data: { message },
      timestamp: new Date()
    });
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate message ID
   */
  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate share link
   */
  private generateShareLink(sessionId: string): string {
    return `taurus://join/${sessionId}`;
  }

  /**
   * Get next color for user cursor
   */
  private getNextColor(): string {
    const color = this.userColors[this.colorIndex % this.userColors.length];
    this.colorIndex++;
    return color;
  }

  /**
   * Export session for recording
   */
  exportSession(sessionId: string): any {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    return {
      id: session.id,
      name: session.name,
      createdBy: session.createdBy,
      createdAt: session.createdAt,
      users: Array.from(session.users.values()),
      messages: session.messages,
      permissions: session.permissions
    };
  }
}
