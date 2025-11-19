/**
 * Replay Engine
 *
 * Play back session history with time-travel capabilities
 */

import { EventEmitter } from 'events';
import { Snapshot, Timeline, ReplayOptions, DiffResult, FileDiff } from './types.js';
import { SnapshotManager } from './snapshot-manager.js';

export class ReplayEngine extends EventEmitter {
  private snapshotManager: SnapshotManager;
  private isPlaying: boolean = false;
  private currentPlaybackIndex: number = 0;

  constructor(snapshotManager: SnapshotManager) {
    super();
    this.snapshotManager = snapshotManager;
  }

  /**
   * Play timeline from beginning
   */
  async play(options: ReplayOptions = {}): Promise<void> {
    const timeline = this.snapshotManager.getTimeline();
    this.isPlaying = true;
    this.currentPlaybackIndex = 0;

    const speed = options.speed || 1;
    const stopAtTime = options.stopAt?.getTime();

    for (let i = 0; i < timeline.snapshots.length && this.isPlaying; i++) {
      const snapshot = timeline.snapshots[i];

      if (stopAtTime && snapshot.timestamp.getTime() >= stopAtTime) {
        break;
      }

      this.currentPlaybackIndex = i;

      // Emit snapshot event
      this.emit('snapshot', {
        index: i,
        total: timeline.snapshots.length,
        snapshot
      });

      // Calculate delay to next snapshot
      if (i < timeline.snapshots.length - 1) {
        const nextSnapshot = timeline.snapshots[i + 1];
        const delay = (nextSnapshot.timestamp.getTime() - snapshot.timestamp.getTime()) / speed;

        await this.sleep(Math.min(delay, 1000)); // Max 1 second per snapshot
      }
    }

    this.isPlaying = false;
    this.emit('playback-complete');
  }

  /**
   * Pause playback
   */
  pause(): void {
    this.isPlaying = false;
    this.emit('paused', this.currentPlaybackIndex);
  }

  /**
   * Resume playback
   */
  async resume(options: ReplayOptions = {}): Promise<void> {
    if (this.currentPlaybackIndex === 0) {
      return this.play(options);
    }

    const timeline = this.snapshotManager.getTimeline();
    this.isPlaying = true;

    const speed = options.speed || 1;

    for (let i = this.currentPlaybackIndex; i < timeline.snapshots.length && this.isPlaying; i++) {
      const snapshot = timeline.snapshots[i];

      this.currentPlaybackIndex = i;

      this.emit('snapshot', {
        index: i,
        total: timeline.snapshots.length,
        snapshot
      });

      if (i < timeline.snapshots.length - 1) {
        const nextSnapshot = timeline.snapshots[i + 1];
        const delay = (nextSnapshot.timestamp.getTime() - snapshot.timestamp.getTime()) / speed;

        await this.sleep(Math.min(delay, 1000));
      }
    }

    this.isPlaying = false;
    this.emit('playback-complete');
  }

  /**
   * Jump to specific snapshot
   */
  jumpTo(snapshotId: string): boolean {
    const timeline = this.snapshotManager.getTimeline();
    const index = timeline.snapshots.findIndex(s => s.id === snapshotId);

    if (index === -1) {
      return false;
    }

    this.currentPlaybackIndex = index;
    const snapshot = timeline.snapshots[index];

    this.emit('jumped', {
      index,
      total: timeline.snapshots.length,
      snapshot
    });

    return true;
  }

  /**
   * Jump to specific time
   */
  jumpToTime(time: Date): boolean {
    const snapshot = this.snapshotManager.getSnapshotAtTime(time);

    if (!snapshot) {
      return false;
    }

    return this.jumpTo(snapshot.id);
  }

  /**
   * Step forward one snapshot
   */
  stepForward(): Snapshot | null {
    const timeline = this.snapshotManager.getTimeline();

    if (this.currentPlaybackIndex >= timeline.snapshots.length - 1) {
      return null;
    }

    this.currentPlaybackIndex++;
    const snapshot = timeline.snapshots[this.currentPlaybackIndex];

    this.emit('stepped', {
      direction: 'forward',
      index: this.currentPlaybackIndex,
      total: timeline.snapshots.length,
      snapshot
    });

    return snapshot;
  }

  /**
   * Step backward one snapshot
   */
  stepBackward(): Snapshot | null {
    if (this.currentPlaybackIndex <= 0) {
      return null;
    }

    this.currentPlaybackIndex--;
    const snapshot = this.snapshotManager.getTimeline().snapshots[this.currentPlaybackIndex];

    this.emit('stepped', {
      direction: 'backward',
      index: this.currentPlaybackIndex,
      total: this.snapshotManager.getTimeline().snapshots.length,
      snapshot
    });

    return snapshot;
  }

  /**
   * Compare two snapshots
   */
  diff(fromId: string, toId: string): DiffResult | null {
    const from = this.snapshotManager.getSnapshot(fromId);
    const to = this.snapshotManager.getSnapshot(toId);

    if (!from || !to) {
      return null;
    }

    const fileChanges: FileDiff[] = [];

    // Compare files
    const allFiles = new Set([...from.filesState.keys(), ...to.filesState.keys()]);

    for (const filePath of allFiles) {
      const fromFile = from.filesState.get(filePath);
      const toFile = to.filesState.get(filePath);

      if (!fromFile && toFile) {
        // File added
        fileChanges.push({
          path: filePath,
          type: 'added',
          linesAfter: toFile.content.split('\n').length,
          additions: toFile.content.split('\n').length,
          deletions: 0
        });
      } else if (fromFile && !toFile) {
        // File deleted
        fileChanges.push({
          path: filePath,
          type: 'deleted',
          linesBefore: fromFile.content.split('\n').length,
          additions: 0,
          deletions: fromFile.content.split('\n').length
        });
      } else if (fromFile && toFile && fromFile.hash !== toFile.hash) {
        // File modified
        const fromLines = fromFile.content.split('\n');
        const toLines = toFile.content.split('\n');

        const additions = toLines.filter(line => !fromLines.includes(line)).length;
        const deletions = fromLines.filter(line => !toLines.includes(line)).length;

        fileChanges.push({
          path: filePath,
          type: 'modified',
          linesBefore: fromLines.length,
          linesAfter: toLines.length,
          additions,
          deletions
        });
      }
    }

    const summary = this.generateDiffSummary(fileChanges);

    return {
      from,
      to,
      fileChanges,
      conversationChanges: to.conversationState.length - from.conversationState.length,
      summary
    };
  }

  /**
   * Generate diff summary
   */
  private generateDiffSummary(fileChanges: FileDiff[]): string {
    const added = fileChanges.filter(f => f.type === 'added').length;
    const modified = fileChanges.filter(f => f.type === 'modified').length;
    const deleted = fileChanges.filter(f => f.type === 'deleted').length;

    const totalAdditions = fileChanges.reduce((sum, f) => sum + f.additions, 0);
    const totalDeletions = fileChanges.reduce((sum, f) => sum + f.deletions, 0);

    return `${added} added, ${modified} modified, ${deleted} deleted | +${totalAdditions} -${totalDeletions}`;
  }

  /**
   * Export session as video metadata
   */
  exportAsVideo(): any {
    const timeline = this.snapshotManager.getTimeline();

    return {
      metadata: {
        sessionId: timeline.sessionId,
        duration: timeline.endTime
          ? timeline.endTime.getTime() - timeline.startTime.getTime()
          : 0,
        snapshots: timeline.snapshots.length
      },
      frames: timeline.snapshots.map((snapshot, index) => ({
        frame: index,
        timestamp: snapshot.timestamp.getTime() - timeline.startTime.getTime(),
        type: snapshot.type,
        description: snapshot.description,
        filesChanged: snapshot.filesState.size
      }))
    };
  }

  /**
   * Get current playback position
   */
  getCurrentPosition(): {
    index: number;
    total: number;
    snapshot: Snapshot;
  } | null {
    const timeline = this.snapshotManager.getTimeline();

    if (this.currentPlaybackIndex >= timeline.snapshots.length) {
      return null;
    }

    return {
      index: this.currentPlaybackIndex,
      total: timeline.snapshots.length,
      snapshot: timeline.snapshots[this.currentPlaybackIndex]
    };
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
