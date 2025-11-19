/**
 * Time-Travel Replay Types
 *
 * Types for session recording and replay
 */

export interface Snapshot {
  id: string;
  timestamp: Date;
  type: 'message' | 'file-change' | 'tool-execution' | 'state-change';
  description: string;
  data: any;
  filesState: Map<string, FileSnapshot>;
  conversationState: any[];
  metadata?: {
    testsPass?: boolean;
    lintErrors?: number;
    buildSuccess?: boolean;
  };
}

export interface FileSnapshot {
  path: string;
  content: string;
  hash: string; // For quick comparison
  size: number;
  modified: Date;
}

export interface Timeline {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  snapshots: Snapshot[];
  currentIndex: number;
}

export interface ReplayOptions {
  speed?: number; // Playback speed multiplier
  stopAt?: Date; // Stop replay at specific time
  includeFileChanges?: boolean;
  includeConversation?: boolean;
}

export interface DiffResult {
  from: Snapshot;
  to: Snapshot;
  fileChanges: FileDiff[];
  conversationChanges: number;
  summary: string;
}

export interface FileDiff {
  path: string;
  type: 'added' | 'modified' | 'deleted';
  linesBefore?: number;
  linesAfter?: number;
  additions: number;
  deletions: number;
}
