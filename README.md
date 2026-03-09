# TextTweener

Animate text transitions by morphing individual letters to their new positions. Shared letters fly to where they appear in the next text, while unique letters fade in and out — creating a unique "anagram solver" effect.

**4.3KB gzipped. Zero dependencies. TypeScript. GPU-accelerated.**

Available as **npm package**, **WordPress Gutenberg Block**, and **After Effects Script**.

## Install

```bash
npm install texttweener
```

Or use a script tag:

```html
<script src="https://unpkg.com/texttweener/dist/index.umd.min.js"></script>
```

## Quick Start

```html
<div id="hero">
  <span class="text">Build something great</span>
  <span class="text">Ship it to the world</span>
  <span class="text">Watch it grow</span>
</div>
```

```js
import { TextTweener } from 'texttweener';

const tt = new TextTweener('#hero');
```

That's it. No fixed dimensions needed — the container sizes itself automatically.

## Options

```js
const tt = new TextTweener('#hero', {
  duration: 4000,            // ms each text is displayed (default: 4000)
  transitionDuration: 800,   // ms for the animation (default: 800)
  stagger: 15,               // ms delay between each letter (default: 15)
  easing: 'cubic-bezier(0.16, 1, 0.3, 1)',  // CSS easing (default)
  textAlign: 'left',         // 'left' | 'center' | 'right' (default: 'left')
  direction: 'forward',      // 'forward' | 'backward' | 'alternate'
  loop: true,                // loop when reaching the end (default: true)
  autoplay: true,            // start automatically (default: true)
  caseSensitive: true,       // 'A' only matches 'A', not 'a' (default: true)
  reduceMotion: true,        // respect prefers-reduced-motion (default: true)
});
```

### Programmatic texts

Pass texts as an array instead of using DOM children:

```js
const tt = new TextTweener('#hero', {
  texts: [
    'Über 30 Sonderzeichen: Klammern (rund), [eckig] & {geschweifte}!',
    'Preise: ab 9,99 € pro Monat. Fragen? E-Mail an info@example.de!',
    'Mathematik: 2 + 2 = 4, aber 100% der Lösung liegt im Detail...',
  ],
});
```

Full Unicode support — letters, numbers, special characters, umlauts, emoji.

## API

```js
tt.play()        // Start or resume playback
tt.pause()       // Pause playback
tt.resume()      // Resume (alias for play)
tt.next()        // Transition to next text (returns Promise)
tt.prev()        // Transition to previous text (returns Promise)
tt.goTo(2)       // Transition to specific index (returns Promise)
tt.destroy()     // Clean up and remove all listeners

tt.current       // Current text index (read-only)
tt.total         // Total number of texts (read-only)
tt.isPlaying     // Whether currently playing (read-only)
```

## Events

```js
tt.on('ready', () => { });
tt.on('beforeTransition', (from, to) => { });
tt.on('afterTransition', (from, to) => { });
tt.on('change', (currentIndex) => { });
tt.on('pause', () => { });
tt.on('resume', () => { });
tt.on('destroy', () => { });

// on() returns an unsubscribe function
const unsub = tt.on('change', (idx) => console.log(idx));
unsub(); // remove listener
```

## How It Works

1. **Measure** — All texts are rendered invisibly to capture the exact position of every letter. The container auto-sizes to fit — no fixed dimensions needed.
2. **Match** — Letters shared between texts are paired using **nearest-neighbor matching**. Instead of matching the 3rd "e" to the 3rd "e", the algorithm finds the physically closest "e" — creating much more natural movement paths.
3. **Animate** — Matched letters fly to their new positions via CSS transforms (GPU-accelerated). Unmatched letters fade out while new letters fade in simultaneously.

## Platforms

### npm / JavaScript

The core library. Works with any framework or vanilla JS.

```bash
npm install texttweener
```

### WordPress

Gutenberg Block with full editor controls — text inputs, timing sliders, easing presets, alignment, font size. See [`wordpress/`](./wordpress/) for the plugin.

### After Effects

ExtendScript panel that generates position and opacity keyframes for each character, using the same nearest-neighbor matching algorithm. See [`aftereffects/`](./aftereffects/) for the script.

## Accessibility

- Creates an `aria-live="polite"` region that announces each text change to screen readers
- Respects `prefers-reduced-motion` — falls back to a simple crossfade
- Keyboard and screen reader friendly

## Browser Support

All modern browsers (Chrome, Firefox, Safari, Edge). Requires Web Animations API support.

## History

Originally built in 2016 as a jQuery plugin (v0.2). Completely rewritten in 2026 as a modern TypeScript library with zero dependencies, GPU-accelerated animations, auto-sizing, nearest-neighbor matching, and full API.

## License

MIT — Michael Rademacher
