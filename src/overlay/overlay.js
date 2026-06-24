let payload;
let state;
let totalMs = 1;

let denialTimer;

function $(selector) {
  return document.querySelector(selector);
}

function overlayCopy() {
  return payload?.copy?.overlay || {};
}

function personaLines() {
  return payload?.personaLines || payload?.copy?.personaLines || {};
}

function applyLanguage() {
  const ui = overlayCopy();
  document.documentElement.lang = payload?.language || 'zh-CN';
  setText('#lockStatus', ui.lockStatus || 'SYSTEM LOCK / RECOVERY REQUIRED');
  setText('#continueAfterBreak', personaLines().decision?.continue || '继续下一轮');
  setText('#finishDay', personaLines().decision?.finish || '今天饶过你');
  setText('#extendBreak', personaLines().decision?.extend || '再恢复 5 分钟');
  setText('#bypassButton', ui.bypassButton || '紧急绕过');
  const password = document.querySelector('input[name="password"]');
  const reason = document.querySelector('input[name="reason"]');
  if (password) password.placeholder = ui.passwordPlaceholder || '紧急绕过密码';
  if (reason) reason.placeholder = ui.reasonPlaceholder || '必须填写绕过原因';
}

function setText(selector, value) {
  const node = $(selector);
  if (node) node.textContent = value;
}

function mmss(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

function applyPack(pack) {
  const root = $('#overlayRoot');
  const mediaLayer = $('#mediaLayer');
  const settings = payload.settings || {};
  const lines = settings.customWarningLines?.length
    ? settings.customWarningLines
    : personaLines().states?.[state.phase]
      ? [personaLines().states[state.phase]]
      : [personaLines().states?.break || '锁定开始。离开屏幕，恢复是下一条命令。'];

  root.dataset.theme = pack.id;
  root.style.setProperty('--accent', settings.accentColor || '#ff3b30');
  root.classList.toggle('intensity-light', settings.intensity === 'light');
  root.classList.toggle('intensity-normal', settings.intensity === 'normal');
  $('#themeName').textContent = overlayCopy().themeLabels?.[pack.id] || pack.name || pack.id;
  const warningLines = $('#warningLines');
  warningLines.replaceChildren();
  for (const line of lines) {
    const paragraph = document.createElement('p');
    paragraph.textContent = line;
    warningLines.appendChild(paragraph);
  }
  mediaLayer.innerHTML = '';
  mediaLayer.style.backgroundImage = '';

  if (pack.type === 'video') {
    const video = document.createElement('video');
    video.src = pack.assets.video;
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.addEventListener('error', () => applyPack(payload.fallbackPack));
    mediaLayer.appendChild(video);
    video.play().catch(() => applyPack(payload.fallbackPack));
  }

  if (pack.type === 'image') {
    const image = new Image();
    image.onload = () => {
      mediaLayer.style.backgroundImage = `url("${pack.assets.image}")`;
    };
    image.onerror = () => applyPack(payload.fallbackPack);
    image.src = pack.assets.image;
  }
}

function renderCountdown() {
  const remaining = Math.max(0, state.endsAt - Date.now());
  $('#countdown').textContent = state.phase === 'awaitingDecision' ? '00:00' : mmss(remaining);
  $('#progressBar').style.width = `${Math.max(0, Math.min(100, (remaining / totalMs) * 100))}%`;
  const decisionPanel = $('#decisionPanel');
  if (decisionPanel) decisionPanel.hidden = state.phase !== 'awaitingDecision';
  if (state.phase === 'awaitingDecision') {
    const warningLines = $('#warningLines');
    warningLines.replaceChildren();
    const paragraph = document.createElement('p');
    paragraph.textContent = personaLines().states?.success || personaLines().states?.awaitingDecision || overlayCopy().fallbackDecision || '休息完成。选择下一步。';
    warningLines.appendChild(paragraph);
  }
}

function startLockRitual() {
  const root = $('#overlayRoot');
  const ritual = payload.ritual;
  if (!ritual || state.phase === 'awaitingDecision') return;
  root.classList.add('lock-ritual');
  root.classList.add(ritual.name);
  showRitualMessage(overlayCopy().ritualMessages?.[ritual.name] || ritual.message);
  setTimeout(() => {
    root.classList.remove('lock-ritual');
    root.classList.remove(ritual.name);
    hideRitualMessage();
  }, ritual.durationMs || 3000);
}

function flashBypassDenied(message) {
  const root = $('#overlayRoot');
  clearTimeout(denialTimer);
  root.classList.add('bypass-denied');
  root.classList.add('warning-snap');
  showRitualMessage(overlayCopy().bypassBlocked || '违规尝试已拦截');
  $('#bypassMessage').textContent = message;
  const warningLines = $('#warningLines');
  warningLines.replaceChildren();
  const paragraph = document.createElement('p');
  paragraph.textContent = personaLines().states?.bypassFailed || message;
  warningLines.appendChild(paragraph);
  denialTimer = setTimeout(() => {
    root.classList.remove('bypass-denied');
    root.classList.remove('warning-snap');
    hideRitualMessage();
  }, 900);
}

function showRitualMessage(text) {
  const node = $('#ritualMessage');
  if (!node) return;
  node.textContent = text || '';
  node.hidden = !text;
}

function hideRitualMessage() {
  const node = $('#ritualMessage');
  if (node) node.hidden = true;
}

function bindPersonaFallback() {
  for (const image of document.querySelectorAll('[data-persona-image]')) {
    image.addEventListener('error', () => {
      image.hidden = true;
      const fallback = image.parentElement?.querySelector?.('[data-persona-fallback]');
      if (fallback) fallback.hidden = false;
    });
  }
}

function beep() {
  if (!payload.settings?.soundEnabled) return;
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'sawtooth';
  oscillator.frequency.value = 110;
  gain.gain.value = 0.04;
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  setTimeout(() => {
    oscillator.stop();
    context.close();
  }, 180);
}

window.breaklockOverlay.getPayload().then((nextPayload) => {
  payload = nextPayload;
  state = payload.state;
  applyLanguage();
  const personaImage = $('#overlayOfficerImage');
  const trainingAsset = state?.persona?.assets?.training || 'discipline-officer-training.png';
  if (personaImage) personaImage.src = `../assets/personas/${trainingAsset}`;
  totalMs = Math.max(1, state.breakMinutes * 60 * 1000);
  applyPack(payload.pack);
  renderCountdown();
  startLockRitual();
  beep();
  setInterval(renderCountdown, 250);
});

window.breaklock.onState((nextState) => {
  state = nextState;
  renderCountdown();
});

$('#continueAfterBreak').addEventListener('click', async () => {
  await window.breaklock.continueAfterBreak();
});

$('#finishDay').addEventListener('click', async () => {
  await window.breaklock.finishDay();
});

$('#extendBreak').addEventListener('click', async () => {
  const result = await window.breaklock.extendBreak();
  if (result.ok) {
    state = result.state;
    totalMs = Math.max(1, state.breakMinutes * 60 * 1000);
    renderCountdown();
  }
});

$('#bypassForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const result = await window.breaklockOverlay.bypass({
    password: form.password.value,
    reason: form.reason.value
  });
  if (result.ok) {
    $('#bypassMessage').textContent = '';
  } else {
    flashBypassDenied(result.error || personaLines().feedback?.bypassFailed || overlayCopy().bypassFailed || '绕过失败。');
  }
});

bindPersonaFallback();
