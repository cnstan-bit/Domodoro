const test = require('node:test');
const assert = require('node:assert/strict');

const {
  personaAssetForStage,
  personaForSession,
  personaStageForPhase,
  personaUnlockPreview
} = require('../src/core/personaStage');

test('persona stage changes with timer phase', () => {
  assert.deepEqual(personaStageForPhase('idle'), {
    mode: 'standby',
    label: '待命凝视',
    lineKey: 'idle'
  });
  assert.equal(personaStageForPhase('focus').mode, 'training');
  assert.equal(personaStageForPhase('shortBreak').mode, 'suppression');
  assert.equal(personaStageForPhase('longBreak').mode, 'suppression');
  assert.equal(personaStageForPhase('awaitingDecision').mode, 'judgment');
});

test('persona unlock preview is local gamification only', () => {
  const preview = personaUnlockPreview(75);

  assert.equal(preview.id, 'crimson-judge');
  assert.equal(preview.unlocked, false);
  assert.equal(preview.requiredScore, 160);
  assert.equal(preview.progress, 47);
});

test('persona asset switches to training form after work starts', () => {
  assert.equal(personaAssetForStage('discipline-officer', 'standby'), 'discipline-officer.png');
  assert.equal(personaAssetForStage('discipline-officer', 'training'), 'discipline-officer-training.png');
  assert.equal(personaAssetForStage('discipline-officer', 'suppression'), 'discipline-officer-training.png');
  assert.equal(personaAssetForStage('discipline-officer', 'judgment'), 'discipline-officer-training.png');
});

test('persona rotates by focus session index', () => {
  assert.equal(personaForSession(0).id, 'discipline-officer');
  assert.notEqual(personaForSession(1).id, personaForSession(0).id);
});
