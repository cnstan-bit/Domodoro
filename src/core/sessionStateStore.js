const fs = require('node:fs');
const path = require('node:path');

function createSessionStateStore(dataDir) {
  const statePath = path.join(dataDir, 'session-state.json');
  return {
    path: statePath,
    load() {
      try {
        const value = JSON.parse(fs.readFileSync(statePath, 'utf8'));
        return value && typeof value === 'object' ? value : null;
      } catch {
        return null;
      }
    },
    save(state) {
      fs.mkdirSync(path.dirname(statePath), { recursive: true });
      fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
      return state;
    },
    clear() {
      try {
        fs.unlinkSync(statePath);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
  };
}

module.exports = { createSessionStateStore };
