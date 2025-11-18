/**
 * Snapshot Manager
 *
 * Records and manages session snapshots for time-travel replay
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { Snapshot, FileSnapshot, Timeline } from './types.js';

export class SnapshotManager {
  private timeline: Timeline;
  private snapshotDir: string;
  private autoSnapshotInterval?: NodeJS.Timeout;

  constructor(sessionId: string, snapshotDir: string) {
    this.snapshotDir = snapshotDir;
    this.timeline = {
      sessionId,
      startTime: new Date(),
      snapshots: [],
      currentIndex: 0
    };

    // Ensure snapshot directory exists
    if (!fs.existsSync(snapshotDir)) {
      fs.mkdirSync(snapshotDir, { recursive: true });
    }

    // Create initial snapshot
    this.createSnapshot('state-change', 'Session started', {});
  }

  /**
   * Create a new snapshot
   */
  createSnapshot(
    type: Snapshot['type'],
    description: string,
    data: any,
    filesTracked: string[] = []
  ): Snapshot {
    const snapshot: Snapshot = {
      id: this.generateSnapshotId(),
      timestamp: new Date(),
      type,
      description,
      data,
      filesState: this.captureFilesState(filesTracked),
      conversationState: []
    };

    this.timeline.snapshots.push(snapshot);
    this.timeline.currentIndex = this.timeline.snapshots.length - 1;

    // Save snapshot to disk
    this.saveSnapshot(snapshot);

    return snapshot;
  }

  /**
   * Capture current state of tracked files
   */
  private captureFilesState(filePaths: string[]): Map<string, FileSnapshot> {
    const filesState = new Map<string, FileSnapshot>();

    for (const filePath of filePaths) {
      try {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          const stats = fs.statSync(filePath);
          const hash = crypto.createHash('md5').update(content).digest('hex');

          filesState.set(filePath, {
            path: filePath,
            content,
            hash,
            size: stats.size,
            modified: stats.mtime
          });
        }
      } catch (error) {
        console.warn(`Failed to capture state of ${filePath}:`, error);
      }
    }

    return filesState;
  }

  /**
   * Restore to a specific snapshot
   */
  restoreSnapshot(snapshotId: string): boolean {
    const snapshot = this.timeline.snapshots.find(s => s.id === snapshotId);
    if (!snapshot) {
      return false;
    }

    // Restore file states
    for (const [filePath, fileSnapshot] of snapshot.filesState) {
      try {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, fileSnapshot.content, 'utf-8');
      } catch (error) {
        console.error(`Failed to restore ${filePath}:`, error);
        return false;
      }
    }

    // Update current index
    this.timeline.currentIndex = this.timeline.snapshots.findIndex(s => s.id === snapshotId);

    return true;
  }

  /**
   * Get snapshot by ID
   */
  getSnapshot(snapshotId: string): Snapshot | undefined {
    return this.timeline.snapshots.find(s => s.id === snapshotId);
  }

  /**
   * Get snapshot at specific time
   */
  getSnapshotAtTime(time: Date): Snapshot | undefined {
    const timestamp = time.getTime();

    for (let i = this.timeline.snapshots.length - 1; i >= 0; i--) {
      if (this.timeline.snapshots[i].timestamp.getTime() <= timestamp) {
        return this.timeline.snapshots[i];
      }
    }

    return this.timeline.snapshots[0];
  }

  /**
   * Get all snapshots in timeline
   */
  getTimeline(): Timeline {
    return this.timeline;
  }

  /**
   * Get snapshots between two times
   */
  getSnapshotsBetween(start: Date, end: Date): Snapshot[] {
    return this.timeline.snapshots.filter(
      s => s.timestamp >= start && s.timestamp <= end
    );
  }

  /**
   * Start automatic snapshots
   */
  startAutoSnapshot(intervalMs: number = 60000): void {
    this.autoSnapshotInterval = setInterval(() => {
      this.createSnapshot('state-change', 'Auto snapshot', {});
    }, intervalMs);
  }

  /**
   * Stop automatic snapshots
   */
  stopAutoSnapshot(): void {
    if (this.autoSnapshotInterval) {
      clearInterval(this.autoSnapshotInterval);
      this.autoSnapshotInterval = undefined;
    }
  }

  /**
   * Save snapshot to disk
   */
  private saveSnapshot(snapshot: Snapshot): void {
    const snapshotPath = path.join(
      this.snapshotDir,
      `${snapshot.id}.json`
    );

    const serialized = {
      ...snapshot,
      filesState: Array.from(snapshot.filesState.entries())
    };

    fs.writeFileSync(snapshotPath, JSON.stringify(serialized, null, 2));
  }

  /**
   * Load snapshot from disk
   */
  loadSnapshot(snapshotId: string): Snapshot | null {
    const snapshotPath = path.join(this.snapshotDir, `${snapshotId}.json`);

    if (!fs.existsSync(snapshotPath)) {
      return null;
    }

    const data = JSON.parse(fs.readFileSync(snapshotPath, 'utf-8'));

    return {
      ...data,
      timestamp: new Date(data.timestamp),
      filesState: new Map(data.filesState)
    };
  }

  /**
   * Generate unique snapshot ID
   */
  private generateSnapshotId(): string {
    return `snap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Export timeline for sharing
   */
  exportTimeline(): any {
    return {
      sessionId: this.timeline.sessionId,
      startTime: this.timeline.startTime,
      endTime: new Date(),
      totalSnapshots: this.timeline.snapshots.length,
      snapshots: this.timeline.snapshots.map(s => ({
        id: s.id,
        timestamp: s.timestamp,
        type: s.type,
        description: s.description,
        filesChanged: s.filesState.size,
        metadata: s.metadata
      }))
    };
  }

  /**
   * Calculate storage size
   */
  getStorageSize(): { snapshots: number; totalSize: number } {
    const files = fs.readdirSync(this.snapshotDir);
    let totalSize = 0;

    for (const file of files) {
      const filePath = path.join(this.snapshotDir, file);
      totalSize += fs.statSync(filePath).size;
    }

    return {
      snapshots: this.timeline.snapshots.length,
      totalSize: totalSize / 1024 / 1024 // MB
    };
  }
}
