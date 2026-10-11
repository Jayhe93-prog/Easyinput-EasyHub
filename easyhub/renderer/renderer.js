'use strict';
/* EasyHub 渲染层：只负责"显示场景 + 键位标签 + 反馈"，不含任何业务逻辑 */
const KEY_IDS = ['KEY1', 'KEY2', 'KEY3', 'KEY4', 'KEY5', 'KEY6', 'KEY7', 'KEY8'];

let state = null;

/* ---------- 视听反馈 ---------- */
let audioCtx = null;
function beep(freq) {
  try {
    audioCtx = audioCtx || new AudioContext();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq || 740;
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.16, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.13);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  } catch (_) { /* 静默失败，不影响功能 */ }
}
function flash(el) {
  if (!el) return;
  el.classList.add('hit');
  setTimeout(() => el.classList.remove('hit'), 150);
}

/* ---------- 渲染 ---------- */
function render() {
  if (!state) return;
  document.getElementById('sceneTag').textContent = '当前场景：' + sceneName(state.active);
  document.getElementById('centerBanner').classList.toggle('show', !!state.centerMode);

  // 场景标签
  const tabs = document.getElementById('tabs');
  tabs.innerHTML = '';
  state.scenes.forEach((s, i) => {
    const t = document.createElement('div');
    t.className = 'tab' + (s.id === state.active ? ' on' : '');
    t.textContent = `KEY${i + 1} · ${s.name}`;
    t.title = s.desc;
    t.onclick = async () => { state = await window.hub.setScene(s.id); render(); };
    tabs.appendChild(t);
  });

  // 键帽
  const keys = document.getElementById('keys');
  keys.innerHTML = '';
  KEY_IDS.forEach((id) => {
    const def = state.current[id] || {};
    const cap = document.createElement('div');
    cap.className = 'cap' + (def.action ? '' : ' empty');
    cap.dataset.key = id;
    cap.innerHTML = `<span class="idx">${id}</span><span>${def.label || '(空)'}</span>`;
    cap.title = def.action ? `${def.action.type} → ${def.action.target}` : '未绑定动作';
    keys.appendChild(cap);
  });

  // 日志
  const ul = document.getElementById('logs');
  ul.innerHTML = '';
  state.log.forEach((row) => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="t">${row.stamp}</span>${escapeHtml(row.text)}`;
    ul.appendChild(li);
  });
}

function sceneName(id) {
  const s = state.scenes.find((x) => x.id === id);
  return s ? s.name : id;
}
function escapeHtml(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

/* ---------- 事件 ---------- */
window.hub.onEvent((ev) => {
  if (ev.type === 'beep') { beep(ev.freq); return; }
  if (ev.type === 'press') {
    flash(document.querySelector(`.cap[data-key="${ev.keyId}"]`));
    return;
  }
  if (ev.type === 'scene') {
    state.active = ev.id;
    render();
    return;
  }
  if (ev.type === 'refresh') {
    state = ev.state;
    render();
  }
});

document.getElementById('knob').addEventListener('click', () => {
  // 窗口内点一下旋钮 = 模拟按键，方便没有板子时也能演示（真机时用真实旋钮）
  flash(document.getElementById('knob'));
  beep(660);
  state.centerMode = !state.centerMode;
  render();
});
document.getElementById('btnReload').onclick = async () => { state = await window.hub.reload(); render(); };
document.getElementById('btnQuit').onclick = () => window.hub.quit();

/* ---------- 启动 ---------- */
window.hub.getState().then((s) => {
  state = s;
  document.getElementById('hint').innerHTML =
    '板子在电脑眼里是标准键盘。本控制台只监听 <b>' +
    Object.values(state.keyMap).filter(Boolean).join(' / ') +
    '</b> 这组板子专用键，所以<b>不影响你的笔记本键盘</b>。' +
    '（没插板子时，点窗口里的旋钮可模拟进入场景台。）';
  render();
});
