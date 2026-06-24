# Contributing

Domodoro's core rule: keep the timer simple and make overlays extensible.

## Development

```bash
npm install
npm test
npm start
```

## Overlay Packs

Prefer adding new packs through `overlay-pack.json` instead of hard-coding one-off UI logic.

Do not load remote webpages or iframe content in overlays. Use local assets or direct HTTPS media files.

## Tests

Core behavior should live in `src/core` and have Node tests under `test/`.
