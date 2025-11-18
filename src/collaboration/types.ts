/**
 * Collaboration Types
 *
 * Types for real-time collaborative sessions
 */

export interface CollaborativeUser {
  id: string;
  name: string;
  email?: string;
  role: 'admin' | 'editor' | 'viewer';
  cursorPosition?: {
    file: string;
    line: number;
    column: number;
  };
  color: string; // For cursor highlighting
  joinedAt: Date;
  lastActivity: Date;
}

export interface CollaborativeSession {
  id: string;
  name: string;
  createdBy: string;
  createdAt: Date;
  users: Map<string, CollaborativeUser>;
  messages: CollaborativeMessage[];
  sharedFiles: Set<string>;
  permissions: SessionPermissions;
}

export interface SessionPermissions {
  maxUsers: number;
  allowFileEdit: boolean;
  allowToolExecution: boolean;
  requireApproval: boolean; // Require admin approval for tool execution
  recordSession: boolean;
}

export interface CollaborativeMessage {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  type: 'chat' | 'ai-response' | 'file-edit' | 'tool-execution' | 'system';
  content: string;
  metadata?: any;
  timestamp: Date;
}

export interface SyncEvent {
  type: 'user-joined' | 'user-left' | 'cursor-move' | 'message' | 'file-change' | 'tool-call';
  sessionId: string;
  userId: string;
  data: any;
  timestamp: Date;
}

export interface JoinSessionRequest {
  sessionId: string;
  userId: string;
  userName: string;
  token?: string; // Optional authentication token
}

export interface JoinSessionResponse {
  success: boolean;
  session?: CollaborativeSession;
  error?: string;
  shareLink?: string;
}
