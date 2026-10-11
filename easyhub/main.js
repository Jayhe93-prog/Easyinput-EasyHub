'use strict';
/**
 * EasyHub · 场景控制台（第八课大作业）
 *
 * 思路：EasyInput 板子在电脑眼里就是一块标准 USB 键盘。
 *  1) 在上位机里把 8 个键改配成 Ctrl+Alt+Shift+1..8、旋钮短按配成 Ctrl+Alt+Shift+9
 *     （组合键，本机几乎不可能误触发）；具体键位以 config/keys.json 为准；
 *  2) 本程序全局监听这组键 —— 因此【零冲突】：只认板子，不影响笔记本自带键盘；
 *  3) 同一排键在不同「场景」下含义不同（场景表是纯数据 config/scenes.json）；
 *  4) 旋钮短按 = 呼出【场景台】，此时 KEY1–KEY8 直接选场景（避免两级菜单，不靠盲记）。
 *
 * 全程不烧录、不改固件，硬件一个字节都没动。
 */
const { app, BrowserWindow, globalShortcut, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const ROOT = __dirname;
const CONFIG_DIR = path.join(ROOT, 'config');

let keyMap = {};
let sceneDoc = { active: null, scenes: [] };
let win = null;
let centerMode = false; // 场景台模式：8 个键临时当作"选场景"
const recentLog = [];
const embedWins = {}; // sceneId -> 该场景的内嵌页面窗口（用于"注入按键"驱动网页）

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function loadConfigs() {
  keyMap = readJSON(path.join(CONFIG_DIR, 'keys.json')).keys;
  sceneDoc = readJSON(path.join(CONFIG_DIR, 'scenes.json'));
  if (!sceneDoc.scenes.some((s) => s.id === sceneDoc.active)) {
    sceneDoc.active = sceneDoc.scenes[0].id;
  }
}

function activeScene() {
  return sceneDoc.scenes.find((s) => s.id === sceneDoc.active) || sceneDoc.scenes[0];
}

function log(text) {
  const stamp = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  recentLog.unshift({ stamp, text });
  if (recentLog.length > 60) recentLog.pop();
}

function push(channel, payload) {
  if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
}

function publicState() {
  const scene = activeScene();
  return {
    keyMap,
    active: scene.id,
    centerMode,
    scenes: sceneDoc.scenes.map((s) => ({ id: s.id, name: s.name, desc: s.desc })),
    current: scene.keys || {},
    log: recentLog
  };
}

/* ---------------- 动作派发：按键 -> 动作 ---------------- */
function dispatch(keyId, keyDef) {
  const action = keyDef && keyDef.action;
  const label = (keyDef && keyDef.label) || '(空)';
  if (!action || !action.type) {
    log(`${keyId} · ${label} —— 空动作，未执行`);
    return;
  }
  try {
    if (action.type === 'run') {
      const args = action.args || [];
      const child = spawn(action.target, args, { detached: true, stdio: 'ignore' });
      child.unref();
      log(`${keyId} · ${label} → 启动 ${path.basename(action.target)}${args.length ? ' ' + args.join(' ') : ''}`);
    } else if (action.type === 'open') {
      shell.openPath(action.target);
      log(`${keyId} · ${label} → 打开 ${action.target}`);
    } else if (action.type === 'url') {
      shell.openExternal(action.target);
      log(`${keyId} · ${label} → ${action.target}`);
    } else if (action.type === 'keys') {
      // 向"内嵌页面"注入键盘事件。
      // 为什么不用系统级合成按键：浏览器会忽略 PowerShell SendKeys 打进来的合成输入（实测无效）。
      // 而 StyleCam 这类页面把监听挂在 document 上、并且读的是 e.code，
      // 直接派发合成 KeyboardEvent 能精确控制 code，既不依赖窗口焦点，也不受 OS 输入层干扰。
      const scene = activeScene();
      const target = embedWins[scene.id];
      if (!target || target.isDestroyed()) {
        log(`${keyId} · ${label} —— 内嵌页面未打开，按键未注入`);
        return;
      }
      const code = action.code;
      target.webContents.executeJavaScript(
        `document.dispatchEvent(new KeyboardEvent('keydown', { code: '${code}', bubbles: true, cancelable: true }))`
      ).catch(() => {});
      log(`${keyId} · ${label} → 向内嵌页面注入按键 ${code}`);
    } else {
      log(`${keyId} · 未知动作类型：${action.type}`);
    }
  } catch (err) {
    log(`${keyId} 执行失败：${err.message}`);
  }
}

/* ---------------- 内嵌页面（场景自带网页时使用） ---------------- */
function openEmbed(scene) {
  if (!scene || !scene.embed) return null;
  let w = embedWins[scene.id];
  if (w && !w.isDestroyed()) {
    w.show();
    w.focus();
    return w;
  }
  w = new BrowserWindow({
    width: 1180,
    height: 800,
    title: `EasyHub 场景 · ${scene.name}`,
    backgroundColor: '#12141a',
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false }
  });
  w.loadFile(path.normalize(scene.embed));
  w.on('closed', () => { delete embedWins[scene.id]; });
  if (scene.setupJS) {
    w.webContents.on('did-finish-load', () => {
      w.webContents.executeJavaScript(scene.setupJS).catch(() => {});
    });
  }
  embedWins[scene.id] = w;
  return w;
}

/* 切到某场景时，自动打开它的内嵌页面（可选） */
function runSceneEnter(scene) {
  if (scene && scene.embed) {
    log(`场景 · 进入「${scene.name}」→ 打开内嵌页面`);
    openEmbed(scene);
  }
}

/* ---------------- 按键总入口 ---------------- */
function onHardwareKey(keyId) {
  // 旋钮短按：开关【场景台】
  if (keyId === 'KNOB') {
    centerMode = !centerMode;
    log(centerMode
      ? '旋钮短按 → 进入【场景台】：按 KEY1–KEY8 选场景，再按旋钮退出'
      : '旋钮短按 → 退出【场景台】');
    push('hub:event', { type: 'beep', freq: centerMode ? 880 : 520 });
    push('hub:event', { type: 'refresh', state: publicState() });
    return;
  }

  // 场景台模式：KEY1–KEY8 = 选第 1–8 个场景
  if (centerMode) {
    const idx = Number(String(keyId).replace('KEY', '')) - 1;
    const target = sceneDoc.scenes[idx];
    if (target) {
      sceneDoc.active = target.id;
      log(`场景切换 → ${target.name}（${target.desc}）`);
      runSceneEnter(target);
      push('hub:event', { type: 'scene', id: target.id, name: target.name });
    } else {
      log(`${keyId} 没有对应场景`);
    }
    push('hub:event', { type: 'beep', freq: 660 });
    push('hub:event', { type: 'refresh', state: publicState() });
    return;
  }

  // 正常模式：按当前场景执行
  const scene = activeScene();
  const keyDef = (scene.keys || {})[keyId];
  push('hub:event', { type: 'press', keyId, label: (keyDef && keyDef.label) || '(空)' });
  push('hub:event', { type: 'beep', freq: 760 });
  dispatch(keyId, keyDef);
  push('hub:event', { type: 'refresh', state: publicState() });
}

/* ---------------- 全局热键注册（只认板子专用键） ---------------- */
function registerHotkeys() {
  globalShortcut.unregisterAll();
  const failed = [];
  Object.keys(keyMap).forEach((keyId) => {
    const acc = keyMap[keyId];
    if (!acc) return;
    const ok = globalShortcut.register(acc, () => onHardwareKey(keyId));
    if (!ok) failed.push(`${keyId}→${acc}`);
  });
  const list = Object.values(keyMap).filter(Boolean).join(' ');
  log(failed.length
    ? `⚠ 热键注册失败（可能被占用）：${failed.join('、')}`
    : `✓ 已注册 ${Object.keys(keyMap).length} 个板子专用热键：${list}`);
  return failed;
}

/* ---------------- 窗口 ---------------- */
function createWindow() {
  win = new BrowserWindow({
    width: 600,
    height: 620,
    minWidth: 480,
    minHeight: 460,
    title: 'EasyHub · 场景控制台',
    backgroundColor: '#12141a',
    alwaysOnTop: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(ROOT, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.loadFile(path.join(ROOT, 'renderer', 'index.html'));
  // 关掉控制台主窗口 = 退出整个程序（内嵌的场景窗口一并关掉，热键注销）
  win.on('closed', () => { win = null; app.quit(); });
}

/* ---------------- IPC ---------------- */
ipcMain.handle('hub:getState', () => publicState());
ipcMain.handle('hub:setScene', (_e, id) => {
  if (sceneDoc.scenes.some((s) => s.id === id)) {
    sceneDoc.active = id;
    log(`场景切换 → ${id}（窗口操作）`);
    runSceneEnter(activeScene());
    push('hub:event', { type: 'refresh', state: publicState() });
  }
  return publicState();
});
ipcMain.handle('hub:reload', () => {
  loadConfigs();
  registerHotkeys();
  push('hub:event', { type: 'refresh', state: publicState() });
  return publicState();
});
ipcMain.handle('hub:quit', () => { app.quit(); });

/* ---------------- 生命周期 ---------------- */
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) { win.show(); win.focus(); }
  });

  app.whenReady().then(() => {
    loadConfigs();
    registerHotkeys();
    createWindow();
  });
}

app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', () => app.quit());
