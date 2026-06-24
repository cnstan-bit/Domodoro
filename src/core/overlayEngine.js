const path = require('node:path');

const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov']);
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif']);

function extensionFromSource(source) {
  try {
    const url = new URL(source);
    return path.extname(url.pathname).toLowerCase();
  } catch {
    return path.extname(String(source || '')).toLowerCase();
  }
}

function isAllowedMediaSource(source, type) {
  if (!source || typeof source !== 'string') return false;

  let url;
  try {
    url = new URL(source);
  } catch {
    return false;
  }

  if (url.protocol !== 'file:' && url.protocol !== 'https:') return false;

  const extension = extensionFromSource(source);
  if (type === 'video') return VIDEO_EXTENSIONS.has(extension);
  if (type === 'image') return IMAGE_EXTENSIONS.has(extension);
  return false;
}

function fallbackPack(packs, settings) {
  const fallbackId = settings?.overlay?.fallbackPackId || 'cyber-alert';
  return packs.find((pack) => pack.id === fallbackId) || packs[0];
}

function selectOverlayPack(packs, settings, randomFn = Math.random) {
  const enabledIds = new Set(settings?.overlay?.enabledPackIds || []);
  const candidates = packs.filter((pack) => pack.allowRandom !== false && enabledIds.has(pack.id));

  if (!candidates.length) return fallbackPack(packs, settings);

  const index = Math.min(
    candidates.length - 1,
    Math.floor(Math.max(0, randomFn()) * candidates.length)
  );
  return candidates[index];
}

function resolveOverlayPack(pack, packs, settings) {
  if (!pack) return fallbackPack(packs, settings);

  if (pack.type === 'video' && !isAllowedMediaSource(pack.assets?.video, 'video')) {
    return fallbackPack(packs, settings);
  }

  if (pack.type === 'image' && !isAllowedMediaSource(pack.assets?.image, 'image')) {
    return fallbackPack(packs, settings);
  }

  return pack;
}

module.exports = {
  isAllowedMediaSource,
  selectOverlayPack,
  resolveOverlayPack
};
