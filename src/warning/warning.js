const WARNING_MS = 60 * 1000;
let warningCopy = {};
let personaMode = 'safe';

function $(selector) {
  return document.querySelector(selector);
}

function setText(selector, value) {
  const node = $(selector);
  if (node) node.textContent = value;
}

function mmss(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function render(state) {
  document.documentElement.lang = warningCopy.language || 'zh-CN';
  setText('#warningEyebrow', warningCopy.warning?.eyebrow || 'DOMODORO WARNING');
  setText('#warningTitle', warningCopy.warning?.title || '一分钟后强制休息');
  const remaining = Math.min(WARNING_MS, Math.max(0, Number(state?.remainingMs || 0)));
  $('#warningCountdown').textContent = mmss(remaining);
  $('#warningProgress').style.width = `${Math.max(0, Math.min(100, (remaining / WARNING_MS) * 100))}%`;
  const personaImage = $('#warningPersonaImage');
  const trainingAsset = personaMode === 'safe'
    ? 'ivory-instructor.png'
    : state?.persona?.assets?.training || 'discipline-officer-training.png';
  if (personaImage && !personaImage.src.endsWith(trainingAsset)) {
    personaImage.src = `../assets/personas/${trainingAsset}`;
  }

  if (state?.phase !== 'focus') {
    $('#warningLine').textContent = warningCopy.warning?.locked || '休息命令已下达。';
    return;
  }

  if (remaining <= 10000) {
    $('#warningLine').textContent = warningCopy.warning?.finalTen || '最后十秒，手离开键盘。';
  } else if (remaining <= 30000) {
    $('#warningLine').textContent = warningCopy.warning?.finalThirty || '三十秒，保存当前进度。';
  } else {
    $('#warningLine').textContent = warningCopy.warning?.finalMinute || '收尾，保存，停手。别等我亲自锁屏。';
  }
}

window.breaklock.getInit().then((payload) => {
  warningCopy = payload.copy || {};
  personaMode = payload.settings?.persona?.personaMode || 'safe';
  render(payload.state);
});

window.breaklock.onState(render);
