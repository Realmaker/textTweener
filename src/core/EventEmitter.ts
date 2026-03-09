/**
 * Minimal typed event emitter.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class EventEmitter<Events extends { [K in keyof Events]: (...args: any[]) => void }> {
  private listeners = new Map<keyof Events, Set<Events[keyof Events]>>();

  on<K extends keyof Events>(event: K, handler: Events[K]): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler as Events[keyof Events]);
    return () => this.off(event, handler);
  }

  off<K extends keyof Events>(event: K, handler: Events[K]): void {
    this.listeners.get(event)?.delete(handler as Events[keyof Events]);
  }

  emit<K extends keyof Events>(event: K, ...args: Parameters<Events[K]>): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    for (const handler of handlers) {
      (handler as (...args: Parameters<Events[K]>) => void)(...args);
    }
  }

  removeAll(): void {
    this.listeners.clear();
  }
}
