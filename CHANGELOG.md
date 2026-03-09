# Changelog

## [2026-03-09] - v1.0.0-alpha.1

### Hinzugefügt
- Komplettes Rewrite als TypeScript Library (Zero Dependencies)
- **Measurer**: Automatische Buchstaben-Messung und Container-Auto-Sizing (kein festes width/height mehr nötig)
- **Matcher**: Nearest-Neighbor Algorithmus — gleiche Buchstaben werden nach kürzester Distanz zugeordnet statt nach Vorkommens-Index
- **Animator**: Web Animations API mit CSS Transforms (GPU-beschleunigt)
- **TextTweener**: Vollständige Public API (play, pause, resume, next, prev, goTo, destroy)
- **Events**: ready, beforeTransition, afterTransition, change, pause, resume, destroy
- **Accessibility**: aria-live Region, prefers-reduced-motion Support (crossfade statt Motion)
- **Responsive**: ResizeObserver mit debounced Remeasurement
- **Unicode**: Intl.Segmenter Support für Emoji/Grapheme Clusters
- `textAlign` Option (left, center, right)
- Case-sensitive Matching als Default (Groß-/Kleinbuchstaben werden unterschieden)
- Paralleles Fade-In neuer Buchstaben (kein Warten auf Move-Ende)
- Build: ESM + CJS + UMD + TypeScript Declarations
- 34 Unit Tests (Vitest + happy-dom)
- Interaktive Demo-Seite mit Controls und Event-Log
- README.md mit vollständiger Dokumentation
- **WordPress Gutenberg Block** — Plugin mit Sidebar-Controls (Texte, Timing, Easing, Font, Alignment)
- **After Effects Script Panel** (.jsx) — gleicher Matching-Algorithmus, erzeugt Keyframes für Position + Opacity

### Geändert
- jQuery Dependency entfernt → Vanilla JS
- `setInterval` → `setTimeout` (kein Drift/Overlap)
- `position: absolute + top/left` → `transform: translate()` (GPU-beschleunigt)
- Feste Container-Maße → Auto-Sizing via Messung aller Texte

### Entfernt
- jQuery Dependency
- Feste width/height Pflicht

### Offene Punkte
- npm Publish
- WordPress Plugin Build mit @wordpress/scripts
- AE Script mit variablen Font-Breiten testen

---

## [2016] - v0.2

### Hinzugefügt
- Support für Zahlen und Sonderzeichen
- Verbesserte Klassen-Benennung

## [2016] - v0.1

### Hinzugefügt
- Initiale Version als jQuery Plugin
- Buchstaben-Animation zwischen Texten
