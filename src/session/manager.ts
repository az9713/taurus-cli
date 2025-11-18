/**
 * Session manager - Handle conversation persistence
 */

import { Session, Message } from '../types/index.js';
import { promises as fs } from 'fs';
import { join } from 'path';
import { logger } from '../utils/logger.js';

export class SessionManager {
  private currentSession: Session | null = null;

  constructor(private sessionDir: string) {}

  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.sessionDir, { recursive: true });
    } catch (error) {
      logger.error(`Failed to create session directory: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  createSession(): Session {
    this.currentSession = {
      id: this.generateSessionId(),
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    logger.debug(`Created session: ${this.currentSession.id}`);
    return this.currentSession;
  }

  async loadSession(sessionId: string): Promise<Session | null> {
    try {
      const sessionPath = join(this.sessionDir, `${sessionId}.json`);
      const content = await fs.readFile(sessionPath, 'utf-8');
      this.currentSession = JSON.parse(content);

      logger.debug(`Loaded session: ${sessionId}`);
      return this.currentSession;
    } catch (error) {
      logger.error(`Failed to load session: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  async saveSession(): Promise<void> {
    if (!this.currentSession) {
      return;
    }

    try {
      const sessionPath = join(this.sessionDir, `${this.currentSession.id}.json`);
      this.currentSession.updatedAt = new Date();
      const content = JSON.stringify(this.currentSession, null, 2);
      await fs.writeFile(sessionPath, content, 'utf-8');

      logger.debug(`Saved session: ${this.currentSession.id}`);
    } catch (error) {
      logger.error(`Failed to save session: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  addMessage(message: Message): void {
    if (!this.currentSession) {
      this.createSession();
    }

    this.currentSession!.messages.push(message);
  }

  getMessages(): Message[] {
    return this.currentSession?.messages || [];
  }

  getCurrentSession(): Session | null {
    return this.currentSession;
  }

  async listSessions(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.sessionDir);
      return files
        .filter((f) => f.endsWith('.json'))
        .map((f) => f.replace('.json', ''));
    } catch (error) {
      return [];
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}
