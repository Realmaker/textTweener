const injectedStyles = new Set<string>();

/**
 * Inject a <style> tag into <head> once per id.
 */
export function injectStyles(css: string, id: string): void {
  if (injectedStyles.has(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
  injectedStyles.add(id);
}

/**
 * Create an HTML element with optional attributes and children.
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Record<string, string>,
  children?: (Node | string)[],
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      el.setAttribute(key, value);
    }
  }
  if (children) {
    for (const child of children) {
      el.append(typeof child === 'string' ? document.createTextNode(child) : child);
    }
  }
  return el;
}
