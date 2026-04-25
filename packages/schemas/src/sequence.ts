export class MonotonicSequence {
  private current = 0;

  next(): number {
    this.current += 1;
    return this.current;
  }

  peek(): number {
    return this.current;
  }

  reset(to = 0): void {
    if (to < 0) {
      throw new Error(`MonotonicSequence cannot reset to negative: ${to}`);
    }
    this.current = to;
  }
}

export function assertMonotonic(events: readonly { sequence: number }[]): void {
  for (let i = 1; i < events.length; i++) {
    const prev = events[i - 1]!.sequence;
    const curr = events[i]!.sequence;
    if (curr <= prev) {
      throw new Error(`Sequence violation at index ${i}: ${curr} <= ${prev}`);
    }
  }
}

export function isMonotonic(events: readonly { sequence: number }[]): boolean {
  try {
    assertMonotonic(events);
    return true;
  } catch {
    return false;
  }
}
