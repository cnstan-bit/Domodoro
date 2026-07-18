const { normalizeLanguage, personaLinesForLanguage } = require('./personaLines');

const zhCN = Object.freeze({
  language: 'zh-CN',
  appTitle: 'Domodoro',
  phaseNames: {
    idle: '空闲',
    focus: '专注中',
    shortBreak: '短休中',
    longBreak: '长休中',
    awaitingDecision: '等待指令'
  },
  stageLabels: {
    idle: '待命凝视',
    focus: '训练监管',
    break: '休息压制',
    longBreak: '深度恢复',
    decision: '审判选择'
  },
  personaNames: {
    'discipline-officer': '纪律调教官',
    'velvet-warden': '绯夜典狱长',
    'ivory-instructor': '白刃教官',
    'onyx-executor': '黑金执行官',
    'crimson-judge': '赤庭审判官'
  },
  ranks: {
    coldStart: '冷启动',
    obedience1: '服从 I',
    obedience2: '服从 II',
    ironRule: '铁律',
    blackGold: '黑金纪律'
  },
  renderer: {
    chamberLabel: '调教官训练舱',
    lockAuthority: 'LOCK AUTHORITY',
    statusStandby: '训练舱待命',
    shortPreset: '短训',
    mediumPreset: '标准',
    longPreset: '深度',
    start: '接受训练',
    snooze: '延长 5 分钟',
    todayDiscipline: '今日纪律',
    scoreLabel: '纪律积分',
    personaArchive: '角色档案',
    unlockAvailable: '已解锁',
    unlockLocked: '未解锁',
    focusSessions: '完成训练',
    breaksCompleted: '合格休息',
    pausesUsed: '额外宽限',
    bypasses: '失控记录',
    armoryTitle: '装备室 / 高级调校',
    armorySubtitle: '套餐、遮罩、约束',
    trainingPresets: '训练套餐',
    shortMinutes: '短训分钟',
    mediumMinutes: '标准分钟',
    longMinutes: '深度分钟',
    manualTimer: '手动计时',
    focusMinutes: '专注分钟',
    shortBreakMinutes: '短休分钟',
    longBreakMinutes: '长休分钟',
    longBreakEvery: '长休间隔',
    overlayEngine: '遮罩引擎',
    customVideo: '启用自定义视频遮罩',
    videoUrl: '视频直链',
    accentColor: '主色',
    intensity: '遮罩强度',
    intensityHard: '狠',
    intensityNormal: '标准',
    intensityLight: '轻',
    customWarnings: '自定义警告语',
    customWarningsPlaceholder: '每行一句',
    soundEnabled: '启用音效',
    personaAndRules: '角色与约束',
    visualMode: '视觉模式',
    darkTrainingChamber: '暗黑训练舱',
    redAlertHud: '红色警戒 HUD',
    pauseLimit: '每日暂停/延长上限',
    bypassPassword: '设置/更新绕过密码',
    bypassPasswordPlaceholder: '留空则不修改',
    startup: '开机自启动',
    language: '界面语言',
    save: '保存调校',
    snoozed: '已延长 5 分钟。'
  },
  overlay: {
    lockStatus: 'SYSTEM LOCK / RECOVERY REQUIRED',
    passwordPlaceholder: '紧急绕过密码',
    reasonPlaceholder: '必须填写绕过原因',
    bypassButton: '紧急绕过',
    fallbackDecision: '休息完成。选择下一步。',
    bypassBlocked: '违规尝试已拦截',
    bypassFailed: '绕过失败。',
    ritualMessages: {
      'whip-lock': '休息命令已执行',
      'warning-snap': '违规尝试已拦截'
    },
    themeLabels: {
      'cyber-alert': 'CYBER ALERT',
      'boss-fight': 'BOSS ENCOUNTER',
      'drill-sergeant': 'DISCIPLINE MODE',
      'deep-space': 'DEEP SPACE FAILURE',
      'countdown-court': 'COUNTDOWN COURT',
      'custom-video': 'CUSTOM VIDEO'
    }
  },
  warning: {
    eyebrow: 'DOMODORO WARNING',
    title: '一分钟后强制休息',
    locked: '休息命令已下达。',
    finalTen: '最后十秒，手离开键盘。',
    finalThirty: '三十秒，保存当前进度。',
    finalMinute: '收尾，保存，停手。别等我亲自锁屏。'
  },
  tray: {
    status: '状态',
    open: '打开 Domodoro',
    insights: '查看分析',
    armory: '装备室 / 设置',
    start: '开始专注',
    snooze: '延长 5 分钟',
    continue: '继续下一轮',
    finish: '今天收工',
    extend: '再恢复 5 分钟',
    settings: '设置 / 统计',
    quit: '退出'
  },
  errors: {
    finishCurrentBreak: '先完成当前休息指令。',
    noContinue: '现在还没有继续指令。',
    cannotFinish: '现在还不能收工。',
    cannotExtend: '现在还不能加休。',
    pauseLimit: '今天的暂停/延长次数已用完。',
    focusOnly: '只有专注中才能延长。',
    reasonRequired: '必须填写绕过原因。',
    passwordMissing: '还没有设置紧急绕过密码。',
    passwordWrong: '密码错误。'
  },
  packNames: {
    '倒计时法庭': '倒计时法庭',
    '赛博警报': '赛博警报',
    'Boss 战拦截': 'Boss 战拦截',
    '深空故障': '深空故障',
    '军规训练': '军规训练'
  },
  personaLines: personaLinesForLanguage('zh-CN')
});

const enUS = Object.freeze({
  language: 'en-US',
  appTitle: 'Domodoro',
  phaseNames: {
    idle: 'Idle',
    focus: 'Focus',
    shortBreak: 'Short Break',
    longBreak: 'Long Break',
    awaitingDecision: 'Awaiting Orders'
  },
  stageLabels: {
    idle: 'Standby Gaze',
    focus: 'Training Watch',
    break: 'Recovery Control',
    longBreak: 'Deep Recovery',
    decision: 'Final Decision'
  },
  personaNames: {
    'discipline-officer': 'Discipline Officer',
    'velvet-warden': 'Velvet Warden',
    'ivory-instructor': 'Ivory Instructor',
    'onyx-executor': 'Onyx Executor',
    'crimson-judge': 'Crimson Judge'
  },
  ranks: {
    coldStart: 'Cold Start',
    obedience1: 'Obedience I',
    obedience2: 'Obedience II',
    ironRule: 'Iron Rule',
    blackGold: 'Black-Gold Discipline'
  },
  renderer: {
    chamberLabel: 'Officer Training Chamber',
    lockAuthority: 'LOCK AUTHORITY',
    statusStandby: 'Chamber Standing By',
    shortPreset: 'Short',
    mediumPreset: 'Standard',
    longPreset: 'Deep',
    start: 'Accept Training',
    snooze: 'Delay 5 Min',
    todayDiscipline: 'Today Discipline',
    scoreLabel: 'Discipline Score',
    personaArchive: 'Persona Archive',
    unlockAvailable: 'Unlocked',
    unlockLocked: 'Locked',
    focusSessions: 'Focus Rounds',
    breaksCompleted: 'Clean Breaks',
    pausesUsed: 'Extra Grace',
    bypasses: 'Control Losses',
    armoryTitle: 'Armory / Advanced Tuning',
    armorySubtitle: 'Presets, overlays, limits',
    trainingPresets: 'Training Presets',
    shortMinutes: 'Short Minutes',
    mediumMinutes: 'Standard Minutes',
    longMinutes: 'Deep Minutes',
    manualTimer: 'Manual Timer',
    focusMinutes: 'Focus Minutes',
    shortBreakMinutes: 'Short Break',
    longBreakMinutes: 'Long Break',
    longBreakEvery: 'Long Break Every',
    overlayEngine: 'Overlay Engine',
    customVideo: 'Enable Custom Video Overlay',
    videoUrl: 'Video Direct URL',
    accentColor: 'Accent',
    intensity: 'Overlay Intensity',
    intensityHard: 'Hard',
    intensityNormal: 'Normal',
    intensityLight: 'Light',
    customWarnings: 'Custom Warning Lines',
    customWarningsPlaceholder: 'One line each',
    soundEnabled: 'Enable Sound',
    personaAndRules: 'Persona & Rules',
    visualMode: 'Visual Mode',
    darkTrainingChamber: 'Dark Training Chamber',
    redAlertHud: 'Red Alert HUD',
    pauseLimit: 'Daily Pause/Extend Limit',
    bypassPassword: 'Set/Update Bypass Password',
    bypassPasswordPlaceholder: 'Leave blank to keep current',
    startup: 'Launch at Startup',
    language: 'Interface Language',
    save: 'Save Tuning',
    snoozed: 'Extended by 5 minutes.'
  },
  overlay: {
    lockStatus: 'SYSTEM LOCK / RECOVERY REQUIRED',
    passwordPlaceholder: 'Emergency bypass password',
    reasonPlaceholder: 'Bypass reason required',
    bypassButton: 'Emergency Bypass',
    fallbackDecision: 'Recovery complete. Choose your next order.',
    bypassBlocked: 'Unauthorized attempt blocked',
    bypassFailed: 'Bypass failed.',
    ritualMessages: {
      'whip-lock': 'Break order executed',
      'warning-snap': 'Unauthorized attempt blocked'
    },
    themeLabels: {
      'cyber-alert': 'CYBER ALERT',
      'boss-fight': 'BOSS ENCOUNTER',
      'drill-sergeant': 'DISCIPLINE MODE',
      'deep-space': 'DEEP SPACE FAILURE',
      'countdown-court': 'COUNTDOWN COURT',
      'custom-video': 'CUSTOM VIDEO'
    }
  },
  warning: {
    eyebrow: 'DOMODORO WARNING',
    title: 'Forced Break In One Minute',
    locked: 'Break order issued.',
    finalTen: 'Final ten seconds. Hands off the keyboard.',
    finalThirty: 'Thirty seconds. Save your progress.',
    finalMinute: 'Wrap up. Save. Stop. Do not make me lock it myself.'
  },
  tray: {
    status: 'Status',
    open: 'Open Domodoro',
    insights: 'View Insights',
    armory: 'Armory / Settings',
    start: 'Start Focus',
    snooze: 'Delay 5 Minutes',
    continue: 'Next Round',
    finish: 'Finish Today',
    extend: 'Recover 5 More',
    settings: 'Settings / Stats',
    quit: 'Quit'
  },
  errors: {
    finishCurrentBreak: 'Finish the current break order first.',
    noContinue: 'There is no continue order yet.',
    cannotFinish: 'You cannot finish yet.',
    cannotExtend: 'You cannot extend yet.',
    pauseLimit: 'Daily pause/extend limit reached.',
    focusOnly: 'You can only delay during focus.',
    reasonRequired: 'A bypass reason is required.',
    passwordMissing: 'Emergency bypass password is not set.',
    passwordWrong: 'Wrong password.'
  },
  packNames: {
    '倒计时法庭': 'Countdown Court',
    '赛博警报': 'Cyber Alert',
    'Boss 战拦截': 'Boss Encounter',
    '深空故障': 'Deep Space Failure',
    '军规训练': 'Drill Sergeant'
  },
  personaLines: personaLinesForLanguage('en-US')
});

function copyForLanguage(language) {
  return normalizeLanguage(language) === 'en-US' ? enUS : zhCN;
}

module.exports = {
  copyForLanguage,
  normalizeLanguage
};
