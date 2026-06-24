const fs = require('node:fs');
const path = require('node:path');
const { isAllowedMediaSource } = require('./overlayEngine');

function readPack(packDir) {
  const packPath = path.join(packDir, 'overlay-pack.json');
  const pack = JSON.parse(fs.readFileSync(packPath, 'utf8'));
  return {
    assets: {},
    defaultText: [],
    sound: null,
    allowRandom: true,
    ...pack,
    packDir
  };
}

function loadBuiltInOverlayPacks(overlaysDir) {
  return fs.readdirSync(overlaysDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(overlaysDir, entry.name))
    .filter((dir) => fs.existsSync(path.join(dir, 'overlay-pack.json')))
    .map(readPack);
}

function loadOverlayPacks(overlaysDir, settings) {
  const packs = loadBuiltInOverlayPacks(overlaysDir);
  const videoUrl = settings?.overlay?.videoUrl || '';

  if (isAllowedMediaSource(videoUrl, 'video')) {
    packs.push({
      id: 'custom-video',
      name: 'Custom Video',
      type: 'video',
      assets: { video: videoUrl },
      defaultText: ['休息时间到了。视频结束前，手离开键盘。'],
      sound: null,
      allowRandom: true,
      packDir: null
    });
  }

  return packs;
}

module.exports = {
  loadOverlayPacks
};
