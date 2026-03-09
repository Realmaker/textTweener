import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from '../src/core/EventEmitter';

interface TestEvents {
  hello: (name: string) => void;
  count: (n: number) => void;
  empty: () => void;
}

describe('EventEmitter', () => {
  it('calls registered handler on emit', () => {
    const emitter = new EventEmitter<TestEvents>();
    const handler = vi.fn();
    emitter.on('hello', handler);
    emitter.emit('hello', 'world');

    expect(handler).toHaveBeenCalledWith('world');
  });

  it('supports multiple handlers for same event', () => {
    const emitter = new EventEmitter<TestEvents>();
    const h1 = vi.fn();
    const h2 = vi.fn();
    emitter.on('hello', h1);
    emitter.on('hello', h2);
    emitter.emit('hello', 'test');

    expect(h1).toHaveBeenCalledWith('test');
    expect(h2).toHaveBeenCalledWith('test');
  });

  it('removes handler with off()', () => {
    const emitter = new EventEmitter<TestEvents>();
    const handler = vi.fn();
    emitter.on('hello', handler);
    emitter.off('hello', handler);
    emitter.emit('hello', 'world');

    expect(handler).not.toHaveBeenCalled();
  });

  it('returns unsubscribe function from on()', () => {
    const emitter = new EventEmitter<TestEvents>();
    const handler = vi.fn();
    const unsub = emitter.on('hello', handler);
    unsub();
    emitter.emit('hello', 'world');

    expect(handler).not.toHaveBeenCalled();
  });

  it('does nothing when emitting event with no handlers', () => {
    const emitter = new EventEmitter<TestEvents>();
    expect(() => emitter.emit('hello', 'world')).not.toThrow();
  });

  it('removeAll clears all handlers', () => {
    const emitter = new EventEmitter<TestEvents>();
    const h1 = vi.fn();
    const h2 = vi.fn();
    emitter.on('hello', h1);
    emitter.on('count', h2);
    emitter.removeAll();
    emitter.emit('hello', 'world');
    emitter.emit('count', 42);

    expect(h1).not.toHaveBeenCalled();
    expect(h2).not.toHaveBeenCalled();
  });
});
