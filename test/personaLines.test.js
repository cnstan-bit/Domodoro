const test = require('node:test');
const assert = require('node:assert/strict');

const { personaLines, personaLinesForLanguage } = require('../src/core/personaLines');

test('persona lines centralize restrained command copy for key interactions', () => {
  assert.match(personaLines.presets.short.title, /短训/);
  assert.match(personaLines.presets.medium.title, /标准/);
  assert.match(personaLines.presets.long.title, /深度/);
  assert.ok(personaLines.decision.continue.length > 0);
  assert.ok(personaLines.decision.finish.length > 0);
  assert.ok(personaLines.decision.extend.length > 0);
  assert.ok(personaLines.states.awaitingDecision.length > 0);
  assert.ok(personaLines.states.success.length > 0);
  assert.ok(personaLines.states.bypassFailed.length > 0);
});

test('persona lines provide English interface copy', () => {
  const english = personaLinesForLanguage('en-US');

  assert.match(english.presets.short.title, /Short/);
  assert.match(english.states.focus, /task/);
  assert.equal(english.decision.continue, 'Next Round');
});
