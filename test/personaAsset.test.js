const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('discipline officer persona asset is available for renderer and overlay', () => {
  const assetPath = path.join(__dirname, '../src/assets/personas/discipline-officer.png');
  assert.equal(fs.existsSync(assetPath), true);
});

test('discipline officer training form asset is available for state switch', () => {
  const assetPath = path.join(__dirname, '../src/assets/personas/discipline-officer-training.png');
  assert.equal(fs.existsSync(assetPath), true);
});

test('extra persona rotation assets are available', () => {
  for (const fileName of ['velvet-warden.png', 'ivory-instructor.png', 'onyx-executor.png']) {
    const assetPath = path.join(__dirname, '../src/assets/personas', fileName);
    assert.equal(fs.existsSync(assetPath), true);
  }
});
