import { describe, it, expect } from 'vitest';
import { updateAriaLive } from '../src/utils/accessibility';

describe('updateAriaLive', () => {
  it('creates aria-live region on first call', () => {
    const container = document.createElement('div');
    updateAriaLive(container, 'Hello World', 'tt');

    const region = container.querySelector('#tt-aria-live');
    expect(region).not.toBeNull();
    expect(region!.getAttribute('aria-live')).toBe('polite');
    expect(region!.getAttribute('aria-atomic')).toBe('true');
    expect(region!.textContent).toBe('Hello World');
  });

  it('updates existing region on subsequent calls', () => {
    const container = document.createElement('div');
    updateAriaLive(container, 'First', 'tt');
    updateAriaLive(container, 'Second', 'tt');

    const regions = container.querySelectorAll('#tt-aria-live');
    expect(regions).toHaveLength(1);
    expect(regions[0].textContent).toBe('Second');
  });

  it('is visually hidden but accessible', () => {
    const container = document.createElement('div');
    updateAriaLive(container, 'Test', 'tt');

    const region = container.querySelector('#tt-aria-live') as HTMLElement;
    expect(region.style.position).toBe('absolute');
    expect(region.style.width).toBe('1px');
    expect(region.style.height).toBe('1px');
    expect(region.style.overflow).toBe('hidden');
  });
});
