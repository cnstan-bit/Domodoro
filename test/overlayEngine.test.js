const test = require('node:test');
const assert = require('node:assert/strict');

const {
  isAllowedMediaSource,
  selectOverlayPack,
  resolveOverlayPack
} = require('../src/core/overlayEngine');

const packs = [
  { id: 'cyber-alert', name: 'Cyber Alert', type: 'css-scene', allowRandom: true },
  { id: 'boss-fight', name: 'Boss Fight', type: 'css-scene', allowRandom: true },
  { id: 'quiet', name: 'Quiet', type: 'css-scene', allowRandom: false },
  { id: 'video-pack', name: 'Video', type: 'video', allowRandom: true, assets: { video: 'https://cdn.example.com/rest.webm' } }
];

test('allows only local files and HTTPS direct media links', () => {
  assert.equal(isAllowedMediaSource('file:///D:/media/rest.mp4', 'video'), true);
  assert.equal(isAllowedMediaSource('https://cdn.example.com/rest.MOV', 'video'), true);
  assert.equal(isAllowedMediaSource('https://cdn.example.com/rest.gif', 'image'), true);

  assert.equal(isAllowedMediaSource('http://cdn.example.com/rest.mp4', 'video'), false);
  assert.equal(isAllowedMediaSource('https://youtube.com/watch?v=x', 'video'), false);
  assert.equal(isAllowedMediaSource('https://cdn.example.com/page.html', 'video'), false);
});

test('selects only enabled random packs', () => {
  const selected = selectOverlayPack(packs, {
    overlay: { enabledPackIds: ['boss-fight'], fallbackPackId: 'cyber-alert' }
  }, () => 0);

  assert.equal(selected.id, 'boss-fight');
});

test('falls back when no enabled random pack is available', () => {
  const selected = selectOverlayPack(packs, {
    overlay: { enabledPackIds: [], fallbackPackId: 'cyber-alert' }
  }, () => 0.9);

  assert.equal(selected.id, 'cyber-alert');
});

test('resolves invalid video overlays to fallback pack', () => {
  const selected = resolveOverlayPack(
    { id: 'bad-video', name: 'Bad Video', type: 'video', allowRandom: true, assets: { video: 'https://example.com/watch?v=1' } },
    packs,
    { overlay: { fallbackPackId: 'cyber-alert' } }
  );

  assert.equal(selected.id, 'cyber-alert');
});
