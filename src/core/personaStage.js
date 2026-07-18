const stageByPhase = Object.freeze({
  idle: {
    mode: 'standby',
    label: '待命凝视',
    lineKey: 'idle'
  },
  focus: {
    mode: 'training',
    label: '训练监管',
    lineKey: 'focus'
  },
  shortBreak: {
    mode: 'suppression',
    label: '休息压制',
    lineKey: 'break'
  },
  longBreak: {
    mode: 'suppression',
    label: '深度恢复',
    lineKey: 'break'
  },
  awaitingDecision: {
    mode: 'judgment',
    label: '审判选择',
    lineKey: 'decision'
  }
});

const personaRoster = Object.freeze([
  {
    id: 'discipline-officer',
    name: '纪律调教官',
    requiredScore: 0,
    unlocked: true,
    assets: {
      standby: 'discipline-officer.png',
      training: 'discipline-officer-training.png'
    }
  },
  {
    id: 'velvet-warden',
    name: '绯夜典狱长',
    requiredScore: 0,
    unlocked: true,
    assets: {
      standby: 'velvet-warden.png',
      training: 'velvet-warden.png'
    }
  },
  {
    id: 'ivory-instructor',
    name: '白刃教官',
    requiredScore: 0,
    unlocked: true,
    assets: {
      standby: 'ivory-instructor.png',
      training: 'ivory-instructor.png'
    }
  },
  {
    id: 'onyx-executor',
    name: '黑金执行官',
    requiredScore: 0,
    unlocked: true,
    assets: {
      standby: 'onyx-executor.png',
      training: 'onyx-executor.png'
    }
  },
  {
    id: 'crimson-judge',
    name: '赤庭审判官',
    requiredScore: 160,
    unlocked: false,
    assets: {
      standby: 'discipline-officer.png',
      training: 'discipline-officer-training.png'
    }
  }
]);

function personaStageForPhase(phase) {
  return stageByPhase[phase] || stageByPhase.idle;
}

function personaForSession(sessionIndex = 0) {
  const available = personaRoster.filter((persona) => persona.unlocked);
  const index = Math.abs(Number(sessionIndex || 0)) % available.length;
  return available[index] || personaRoster[0];
}

function personaById(personaId) {
  return personaRoster.find((persona) => persona.id === personaId) || personaRoster[0];
}

function personaAssetForStage(personaId, mode) {
  const persona = personaById(personaId);
  return mode === 'standby'
    ? persona.assets.standby
    : persona.assets.training;
}

function personaUnlockPreview(score) {
  const safeScore = Math.max(0, Number(score || 0));
  const locked = personaRoster.find((persona) => !persona.unlocked) || personaRoster[0];
  const requiredScore = Math.max(0, Number(locked.requiredScore || 0));
  const currentScore = requiredScore ? Math.min(safeScore, requiredScore) : 0;
  const progress = requiredScore
    ? Math.min(100, Math.round((currentScore / requiredScore) * 100))
    : 100;

  return {
    ...locked,
    requiredScore,
    currentScore,
    remainingScore: Math.max(0, requiredScore - safeScore),
    unlocked: safeScore >= requiredScore,
    progress
  };
}

module.exports = {
  personaAssetForStage,
  personaById,
  personaForSession,
  personaRoster,
  personaStageForPhase,
  personaUnlockPreview
};
