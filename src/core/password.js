const crypto = require('node:crypto');

function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password || ''), 'utf8').digest('hex');
}

function verifyPassword(password, expectedHash) {
  if (!expectedHash) return false;
  const actual = hashPassword(password);
  if (actual.length !== String(expectedHash).length) return false;
  return crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expectedHash));
}

module.exports = {
  hashPassword,
  verifyPassword
};
