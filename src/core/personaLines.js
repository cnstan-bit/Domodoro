const personaLines = Object.freeze({
  presets: {
    short: {
      title: '短训 20m',
      subtitle: '先热身，别装死。',
      command: '二十分钟，姿态给我稳住。'
    },
    medium: {
      title: '标准 40m',
      subtitle: '标准训练，给我稳住。',
      command: '四十分钟，够你证明自己。'
    },
    long: {
      title: '深度 60m',
      subtitle: '深度服从，别半路逃。',
      command: '一小时，不许散。'
    }
  },
  states: {
    idle: '站好，选一档训练。',
    focus: '现在归我管。盯住任务，别乱跑。',
    shortBreak: '手离开键盘，恢复也是命令。',
    longBreak: '长休开始。脑子冷下来，再回来。',
    break: '锁定开始。离开屏幕，恢复是下一条命令。',
    decision: '休息完成。继续下一轮，还是今天收工？',
    success: '休息完成，纪律积分已入账。',
    bypassFailed: '密码不对。冷静点，按规则来。',
    awaitingDecision: '休息完成。继续、收工，还是再恢复五分钟？'
  },
  decision: {
    continue: '继续下一轮',
    finish: '今天饶过你',
    extend: '再恢复 5 分钟'
  },
  feedback: {
    saved: '设置收下了。别让我重复第二遍。',
    started: '训练开始。到点我会亲自拦你。',
    bypassFailed: '密码不对。失控不解决问题。',
    bypassed: '失控记录已记下。',
    breakComplete: '恢复合格，纪律积分到账。',
    extended: '准你再恢复五分钟。',
    finished: '今天到此为止。下次别松。'
  }
});

const englishPersonaLines = Object.freeze({
  presets: {
    short: {
      title: 'Short Drill 20m',
      subtitle: 'Warm up. No drifting.',
      command: 'Twenty minutes. Stay sharp.'
    },
    medium: {
      title: 'Standard 40m',
      subtitle: 'Hold the line.',
      command: 'Forty minutes. Prove your control.'
    },
    long: {
      title: 'Deep 60m',
      subtitle: 'Deep work. No escape.',
      command: 'One hour. Do not scatter.'
    }
  },
  states: {
    idle: 'Stand straight. Choose your drill.',
    focus: 'You are under command now. Eyes on the task.',
    shortBreak: 'Hands off the keyboard. Recovery is an order.',
    longBreak: 'Long recovery. Cool your head, then return.',
    break: 'Lockdown started. Step away until the next order.',
    decision: 'Recovery complete. Continue, finish, or extend?',
    success: 'Recovery complete. Discipline points secured.',
    bypassFailed: 'Wrong password. Breathe and follow the rules.',
    awaitingDecision: 'Recovery complete. Continue, finish, or take five more minutes?'
  },
  decision: {
    continue: 'Next Round',
    finish: 'Dismissed Today',
    extend: 'Recover 5 More'
  },
  feedback: {
    saved: 'Settings accepted. Do not make me repeat it.',
    started: 'Training started. I will stop you when time is up.',
    bypassFailed: 'Wrong password. Losing control solves nothing.',
    bypassed: 'Loss-of-control record saved.',
    breakComplete: 'Recovery passed. Discipline points secured.',
    extended: 'Five more minutes granted.',
    finished: 'Enough for today. Do not slack next time.'
  }
});

const personaLineCatalog = Object.freeze({
  'zh-CN': personaLines,
  'en-US': englishPersonaLines
});

function normalizeLanguage(language) {
  return String(language || '').toLowerCase().startsWith('en') ? 'en-US' : 'zh-CN';
}

function personaLinesForLanguage(language) {
  return personaLineCatalog[normalizeLanguage(language)] || personaLines;
}

module.exports = {
  normalizeLanguage,
  personaLineCatalog,
  personaLines,
  personaLinesForLanguage
};
