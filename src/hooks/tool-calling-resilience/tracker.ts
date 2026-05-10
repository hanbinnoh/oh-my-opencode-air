export interface FailureKey {
  sessionID: string;
  tool: string;
  errorPatternId: string;
}

export interface FailureRecord {
  count: number;
  firstSeen: number;
  lastSeen: number;
  outputs: string[];
}

const LOOP_DETECTION_THRESHOLD = 3;
const LOOP_DETECTION_WINDOW_MS = 60_000;
const MAX_TRACKED_FAILURES_PER_SESSION = 50;

class FailureTracker {
  private store = new Map<string, FailureRecord>();

  private makeKey(key: FailureKey): string {
    return `${key.sessionID}::${key.tool}::${key.errorPatternId}`;
  }

  record(key: FailureKey, output: string): FailureRecord {
    const now = Date.now();
    const storeKey = this.makeKey(key);
    const existing = this.store.get(storeKey);

    if (existing) {
      existing.count += 1;
      existing.lastSeen = now;
      if (existing.outputs.length < 3) {
        existing.outputs.push(output);
      }
      return existing;
    }

    const record: FailureRecord = {
      count: 1,
      firstSeen: now,
      lastSeen: now,
      outputs: [output],
    };

    this.store.set(storeKey, record);
    this.evictIfNeeded();
    return record;
  }

  isLoop(key: FailureKey): boolean {
    const storeKey = this.makeKey(key);
    const record = this.store.get(storeKey);
    if (!record) return false;

    const now = Date.now();
    const withinWindow = now - record.firstSeen <= LOOP_DETECTION_WINDOW_MS;
    return withinWindow && record.count >= LOOP_DETECTION_THRESHOLD;
  }

  getFailureCount(key: FailureKey): number {
    return this.store.get(this.makeKey(key))?.count ?? 0;
  }

  resetSession(sessionID: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(`${sessionID}::`)) {
        this.store.delete(key);
      }
    }
  }

  private evictIfNeeded(): void {
    if (this.store.size <= MAX_TRACKED_FAILURES_PER_SESSION) return;

    let oldestKey: string | null = null;
    let oldestTime = Number.POSITIVE_INFINITY;
    for (const [k, v] of this.store.entries()) {
      if (v.lastSeen < oldestTime) {
        oldestTime = v.lastSeen;
        oldestKey = k;
      }
    }
    if (oldestKey) {
      this.store.delete(oldestKey);
    }
  }
}

export function createFailureTracker(): FailureTracker {
  return new FailureTracker();
}
