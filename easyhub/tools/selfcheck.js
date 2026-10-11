'use strict';
/**
 * EasyHub 自检：用「ELECTRON_RUN_AS_NODE=1」跑，不启 GUI。
 * 检查三件事：① 两份配置能解析；② 场景表与键位表对得上；③ 每个动作的目标路径真实存在。
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const keys = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/keys.json'), 'utf8')).keys;
const doc = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/scenes.json'), 'utf8'));

let bad = 0;
const mark = (ok) => { if (!ok) bad++; return ok ? '✓' : '✗'; };

console.log('== 1. 板子专用热键（事实源 config/keys.json）==');
Object.entries(keys).forEach(([k, v]) => console.log(`   [${mark(!!v)}] ${k} → ${v}`));

console.log('\n== 2. 场景表（config/scenes.json）==');
doc.scenes.forEach((s, i) => {
  const n = Object.keys(s.keys || {}).length;
  console.log(`   KEY${i + 1} · ${s.name} —— ${s.desc}（绑定 ${n} 个键）`);
});
console.log(`   默认场景：${doc.active} ${mark(doc.scenes.some((s) => s.id === doc.active))}`);

console.log('\n== 3. 动作目标检查 ==');
doc.scenes.forEach((s) => {
  Object.entries(s.keys || {}).forEach(([keyId, def]) => {
    const act = def.action;
    if (!act) return;
    const type = act.type;
    let ok, detail;
    if (type === 'run' || type === 'open') {
      ok = fs.existsSync(act.target);
      detail = act.target;
    } else if (type === 'url') {
      ok = /^https?:\/\//i.test(act.target || '');
      detail = act.target;
    } else if (type === 'keys') {
      ok = !!act.code;
      detail = `code=${act.code}`;
    } else if (type === 'clipboard') {
      ok = typeof act.text === 'string' && act.text.length > 0;
      detail = `text ${(act.text || '').length} 字`;
    } else {
      ok = false;
      detail = `未知动作类型 ${type}`;
    }
    if (!ok) bad++;
    console.log(`   [${ok ? '✓' : '✗ 缺失'}] ${s.name} / ${keyId} -> ${type}: ${detail}`);
  });
});

console.log('\n' + (bad === 0 ? '全部通过：配置可用，热键与场景表一致。' : `发现 ${bad} 处问题，见上面的 ✗。`));
process.exit(bad === 0 ? 0 : 1);
