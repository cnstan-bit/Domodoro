# Overlay Pack Guide

Overlay Packs are Domodoro's extension point for forced-break experiences. A pack controls what appears during a break while the timer and safety rules stay in the app core.

## Location

Create a folder under:

```text
src/overlays/<pack-id>/
```

Each pack needs:

```text
overlay-pack.json
```

## Manifest

```json
{
  "id": "cyber-alert",
  "name": "Cyber Alert",
  "type": "css-scene",
  "assets": {},
  "defaultText": [
    "Stand up.",
    "Let your brain cool down."
  ],
  "sound": "pulse",
  "allowRandom": true
}
```

## Fields

- `id`: stable lowercase identifier.
- `name`: display name.
- `type`: `css-scene`, `image`, or `video`.
- `assets`: local asset paths used by the pack.
- `defaultText`: fallback break messages.
- `sound`: optional sound hint.
- `allowRandom`: whether the pack can be selected randomly.

## Supported Types

### css-scene

Uses the built-in overlay renderer and CSS theme hooks. This is the safest default for contributors.

### image

Uses a static image or animated GIF as the background.

```json
{
  "type": "image",
  "assets": {
    "image": "file://C:/path/to/background.gif"
  }
}
```

### video

Uses a local video file or direct HTTPS media URL.

```json
{
  "type": "video",
  "assets": {
    "video": "https://example.com/rest.webm"
  }
}
```

## Security Rules

Domodoro intentionally does not load:

- Remote webpages.
- `iframe` content.
- YouTube or Bilibili page URLs.
- Arbitrary third-party JavaScript.

Video overlays must be `file://` media or HTTPS direct `.mp4`, `.webm`, or `.mov` links.

## Testing a Pack

1. Add the pack folder.
2. Enable it in Domodoro settings.
3. Start a short focus session.
4. Confirm the break overlay appears.
5. Disable the pack and confirm it is no longer randomly selected.
