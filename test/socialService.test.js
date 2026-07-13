const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { createEncryptedStorage, createSocialService } = require('../src/main/socialService');

const fakeSafeStorage = {
  isEncryptionAvailable: () => true,
  encryptString: (value) => Buffer.from(`safe:${value}`, 'utf8'),
  decryptString: (value) => value.toString('utf8').replace(/^safe:/, '')
};

test('social auth storage persists encrypted values', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'domodoro-social-'));
  const filePath = path.join(dir, 'session.dat');
  const storage = createEncryptedStorage(filePath, fakeSafeStorage);
  storage.setItem('token', 'secret');
  assert.equal(storage.getItem('token'), 'secret');
  assert.equal(fs.readFileSync(filePath, 'utf8').includes('secret'), false);
  storage.removeItem('token');
  assert.equal(storage.getItem('token'), null);
});

test('social service stays available in local-only mode when cloud is not configured', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'domodoro-social-'));
  const service = createSocialService({ dataDir: dir, safeStorage: fakeSafeStorage, openExternal: async () => {}, env: {} });
  assert.deepEqual(await service.getState(), { configured: false, authenticated: false, profile: null, squad: null, members: [] });
  await assert.rejects(() => service.requestEmailCode('test@example.com'), /not configured/i);
});

test('auth storage stays memory-only when Windows encryption is unavailable', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'domodoro-social-'));
  const filePath = path.join(dir, 'session.dat');
  const storage = createEncryptedStorage(filePath, { isEncryptionAvailable: () => false });
  storage.setItem('token', 'memory-secret');
  assert.equal(storage.getItem('token'), 'memory-secret');
  assert.equal(fs.existsSync(filePath), false);
});
