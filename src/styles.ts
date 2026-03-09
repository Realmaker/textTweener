export function getStructuralCSS(prefix: string): string {
  return `
.${prefix}-container {
  position: relative;
  overflow: hidden;
}
.${prefix}-text {
  width: 100%;
}
.${prefix}-text[aria-hidden="true"] {
  position: absolute;
  top: 0;
  left: 0;
  visibility: hidden;
  pointer-events: none;
}
.${prefix}-char {
  display: inline-block;
  white-space: pre;
}
.${prefix}-space {
  display: inline;
}
.${prefix}-measuring {
  position: absolute !important;
  visibility: hidden !important;
  pointer-events: none !important;
  top: 0;
  left: 0;
}
`.trim();
}
