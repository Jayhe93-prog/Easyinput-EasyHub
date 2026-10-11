/* ============ StyleCam 主流程状态机与 UI ============ */
window.StyleCam = window.StyleCam || {};

(function (SC) {
  'use strict';

  /* ---------- 状态定义 ---------- */
  var ST = {
    WORKBENCH: 0,
    BROWSING: 1,
    STRENGTH: 2,
    MODE_SELECT: 3,
    GENERATING: 4,
    RESULT: 5,
    RESULT_SMALL: 6,
    DISPLAY: 7
  };
  SC.ST = ST;

  var INSPIRES = [
    '把毛线质感用在城市夜景上，路灯都变成会发光的毛线球。',
    '用果冻宇宙做一株会发光的水母植物，透明、轻盈、有弹性。',
    '机甲模型盒风格，把你家的宠物变成可装配的收藏品。',
    '孔版夏日：把海边的照片印成颗粒分明的油墨。',
    '积木星球：用方块重搭你书桌的一角。',
    '口袋生态舱：把你喜欢的场景装进一颗玻璃球。'
  ];

  /* ---------- 应用状态 ---------- */
  var app = {
    schemeId: 'default',
    state: ST.WORKBENCH,
    compareActive: false,
    materials: [],
    activeMaterial: 0,
    styles: SC.allStyles(),
    styleIndex: 0,
    strength: 50,
    mode: 'generate',
    displayEffect: 'dots',
    displayWin: null,
    displayTarget: null,
    currentWork: null,
    previewDataURL: null,
    detectedStyleId: null
  };

  /* ---------- DOM 引用 ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var el = {
    demoBadge: $('demoBadge'), btnScheme: $('btnScheme'), schemeName: $('schemeName'), schemeDot: $('schemeDot'),
    btnHelp: $('btnHelp'),
    statusText: $('statusText'), statusMeta: $('statusMeta'),
    stageImg: $('stageImg'), stagePlaceholder: $('stagePlaceholder'), stageInner: $('stageInner'), stageStyleTag: $('stageStyleTag'),
    styleGallery: $('styleGallery'),
    printerState: $('printerState'), previewImg: $('previewImg'), previewStyleTag: $('previewStyleTag'),
    previewStrength: $('previewStrength'), previewEmpty: $('previewEmpty'), fxCanvas: $('fxCanvas'), printerWindow: $('printerWindow'),
    btnGenerate: $('btnGenerate'), strengthTrack: $('strengthTrack'),
    strengthFill: $('strengthFill'), strengthKnob: $('strengthKnob'), strengthValue: $('strengthValue'),
    styleName: $('styleName'), styleIndex: $('styleIndex'),
    paperArea: $('paperArea'), paper: $('paper'), paperImg: $('paperImg'),
    keysZone: $('keysZone'), knobCap: $('knobCap'),
    fileInput: $('fileInput'), uploadZone: $('uploadZone'), btnSample: $('btnSample'), materialStrip: $('materialStrip'),
    worksGrid: $('worksGrid'), worksEmpty: $('worksEmpty'),
    schemeModal: $('schemeModal'), schemeTableBody: $('schemeTableBody'), schemeNote: $('schemeNote'),
    inspireModal: $('inspireModal'), inspireList: $('inspireList'),
    inspireStyleBtn: $('inspireStyleBtn'), inspireStyleList: $('inspireStyleList'), inspireStyleHint: $('inspireStyleHint'),
    tutorialModal: $('tutorialModal'),
    toastWrap: $('toastWrap')
  };

  /* ---------- 小工具 ---------- */
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function keyOf(action) {
    var scheme = SC.schemeById(app.schemeId);
    for (var i = 1; i <= 8; i++) {
      if (scheme.keys['Digit' + i] === action) return 'S' + i;
    }
    return null;
  }
  function toast(msg, ms) {
    var t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    el.toastWrap.appendChild(t);
    setTimeout(function () {
      t.classList.add('out');
      setTimeout(function () { t.remove(); }, 320);
    }, ms || 2200);
  }
  function strengthLabel(v) { return SC.strengthLevel(v) === 'low' ? '低' : (SC.strengthLevel(v) === 'mid' ? '中' : '高'); }
  function currentStyle() { return app.styles[app.styleIndex]; }
  function materialSrc() {
    var m = app.materials[app.activeMaterial];
    return m ? m.src : null;
  }
  function hasMaterials() { return app.materials.length > 0; }

  /* ---------- 可用动作（决定键位高亮与状态提示） ---------- */
  function availableActions(state) {
    switch (state) {
      case ST.BROWSING:     return ['knobLeft', 'knobRight', 'strength', 'generate', 'mode', 'inspire', 'reset'];
      case ST.STRENGTH:     return ['knobLeft', 'knobRight', 'knobPress', 'reset'];
      case ST.MODE_SELECT:  return ['knobLeft', 'knobRight', 'knobPress'];
      case ST.GENERATING:   return [];
      case ST.RESULT:       return ['view', 'save', 'collapse', 'compare', 'generate'];
      case ST.RESULT_SMALL: return ['view', 'save', 'collapse', 'compare'];
      case ST.DISPLAY:      return ['knobLeft', 'knobRight', 'knobPress', 'view', 'save', 'collapse'];
      default:              return ['inspire'];
    }
  }

  var STATUS_TEXT = {};
  STATUS_TEXT[ST.WORKBENCH] = '放入素材，开始创作';
  STATUS_TEXT[ST.BROWSING] = function () {
    var s = '旋转选风格';
    var k = keyOf('strength');
    if (k) s += ' · ' + k + ' 调强度';
    s += ' · ' + (keyOf('generate') || '生成钮') + ' 生成';
    return s;
  };
  STATUS_TEXT[ST.STRENGTH] = '旋钮调节创意强度，短按确认';
  STATUS_TEXT[ST.MODE_SELECT] = '旋钮选择模式（风格生成 / 创意显示），短按确认';
  STATUS_TEXT[ST.GENERATING] = '正在生成…';
  STATUS_TEXT[ST.RESULT] = function () {
    return (keyOf('save') || 'S3') + ' 保存 · ' + (keyOf('collapse') || 'S4') + ' 收起 · ' + (keyOf('compare') || 'S5') + ' 对比 · ' + (keyOf('view') || 'S2') + ' 缩小';
  };
  STATUS_TEXT[ST.RESULT_SMALL] = function () {
    return (keyOf('view') || 'S2') + ' 再按进入创意显示 · ' + (keyOf('save') || 'S3') + ' 保存 · ' + (keyOf('collapse') || 'S4') + ' 收起';
  };
  STATUS_TEXT[ST.DISPLAY] = '旋钮切换效果 · ' + (keyOf('view') || 'S2') + ' / ' + (keyOf('collapse') || 'S4') + ' 返回工作台';

  /* ---------- 渲染 ---------- */
  function setState(s) {
    app.state = s;
    app.compareActive = false;
    renderAll();
  }

  function renderAll() {
    renderStatus();
    renderKeys();
    renderStrength();
    renderMaterials();
    renderWorks();
    renderPaper();
  }

  function renderStatus() {
    var txt = STATUS_TEXT[app.state];
    el.statusText.innerHTML = typeof txt === 'function' ? txt() : txt;
    if (app.state === ST.RESULT && app.compareActive) {
      el.statusText.innerHTML = '对比中 · ' + (keyOf('compare') || 'S5') + ' 恢复结果';
    }
    var meta = [];
    if (app.mode === 'display') meta.push('模式：创意显示');
    else meta.push('模式：风格生成');
    if (app.state === ST.BROWSING || app.state === ST.RESULT || app.state === ST.RESULT_SMALL || app.state === ST.GENERATING) {
      meta.push('风格 <b>' + currentStyle().name + '</b>');
    }
    if (app.state === ST.STRENGTH) meta.push('强度 <b>' + app.strength + '</b>');
    el.statusMeta.innerHTML = meta.join(' · ');

    el.styleName.textContent = currentStyle().name;
    el.styleIndex.textContent = (app.styleIndex + 1) + ' / ' + app.styles.length;
    el.previewStyleTag.textContent = currentStyle().name;
    el.previewStrength.textContent = '强度 ' + strengthLabel(app.strength) + ' ' + app.strength;

    var busy = app.state === ST.GENERATING;
    el.printerState.textContent = busy ? '生成中' : (app.state === ST.BROWSING ? '浏览风格' : '待机');
    el.printerState.classList.toggle('busy', busy);
    el.printerWindow.classList.toggle('generating', busy);
    el.btnGenerate.disabled = !hasMaterials();

    el.schemeName.textContent = SC.schemeById(app.schemeId).name;
    el.schemeDot.classList.toggle('custom', app.schemeId === 'custom');

    el.stageStyleTag.textContent = currentStyle().name;
    syncStyleGallery();
    updateStageBackdrop();
    refreshStageImage();
  }

  function renderKeys() {
    var labels = SC.schemeKeyLabels(app.schemeId);
    var avail = availableActions(app.state);
    var html = '';
    for (var i = 0; i < 8; i++) {
      var l = labels[i];
      var isEmpty = !l.action;
      var isAvail = !isEmpty && avail.indexOf(l.action) >= 0;
      html +=
        '<div class="key ' + (isAvail ? 'available' : '') + (isEmpty ? ' empty' : '') + (app.schemeId === 'custom' ? ' custom' : '') + '" data-action="' + l.action + '">' +
        '<div class="key-cap">S' + (i + 1) + '</div>' +
        '<div class="key-label">' + (isEmpty ? '—' : l.label) + '</div>' +
        '<div class="key-led"></div></div>';
    }
    el.keysZone.innerHTML = html;
  }

  function renderStrength() {
    el.strengthFill.style.width = app.strength + '%';
    el.strengthKnob.style.left = app.strength + '%';
    el.strengthValue.textContent = strengthLabel(app.strength);
  }

  function renderMaterials() {
    if (!app.materials.length) {
      el.materialStrip.innerHTML = '';
      el.stageImg.style.display = 'none';
      el.stagePlaceholder.style.display = '';
      el.stagePlaceholder.textContent = '素材完整展示';
      el.previewImg.style.display = 'none';
      el.previewEmpty.style.display = '';
      return;
    }
    el.stagePlaceholder.style.display = 'none';
    el.stageImg.style.display = '';
    el.previewEmpty.style.display = 'none';
    el.stageImg.src = materialSrc();
    var html = '';
    app.materials.forEach(function (m, i) {
      html += '<div class="thumb ' + (i === app.activeMaterial ? 'active' : '') + '" data-idx="' + i + '">' +
        '<img src="' + m.src + '" alt="">' +
        '<button class="thumb-close" data-idx="' + i + '" title="移除">×</button>' +
        (app.materials.length > 1 ? '<span class="thumb-order">' + (i === 0 ? '主体' : '配件') + '</span>' : '') +
        '</div>';
    });
    el.materialStrip.innerHTML = html;
  }

  function renderWorks() {
    var works = SC.Storage.getWorks();
    if (!works.length) {
      el.worksGrid.innerHTML = '<div class="works-empty" id="worksEmpty">还没有作品，去创作一张吧</div>';
      return;
    }
    var html = '';
    works.forEach(function (w) {
      var style = SC.styleById(w.styleId);
      html += '<div class="work-card" data-id="' + w.id + '">' +
        '<img src="' + w.dataURL + '" alt="">' +
        '<div class="work-meta"><span>' + (style ? style.name : '作品') + '</span>' +
        (w.demo ? '<span class="demo-mark">本地演示</span>' : '') + '</div></div>';
    });
    el.worksGrid.innerHTML = html;
  }

  /* ---------- 风格画廊 ---------- */
  function renderStyleGallery() {
    el.styleGallery.innerHTML = '';
    app.styles.forEach(function (style) {
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'style-card' + (style.id === currentStyle().id ? ' active' : '');
      card.setAttribute('data-style-id', style.id);
      card.innerHTML =
        '<img alt="' + style.name + '">' +
        '<span class="style-card-name">' + style.name + '</span>' +
        '<span class="style-card-tag">' + style.tagline + '</span>' +
        '<span class="style-card-check">✓</span>';
      el.styleGallery.appendChild(card);
      SC.makeStyleCard(style, 55, null).then(function (c) {
        card.querySelector('img').src = c.toDataURL('image/jpeg', 0.85);
      });
    });
  }

  function syncStyleGallery() {
    var cur = currentStyle().id;
    var cards = el.styleGallery.querySelectorAll('.style-card');
    for (var i = 0; i < cards.length; i++) {
      cards[i].classList.toggle('active', cards[i].getAttribute('data-style-id') === cur);
    }
  }

  /* 画布背景跟随当前风格（同一风格只生成一次） */
  var lastBackdropId = null;
  function updateStageBackdrop() {
    var style = currentStyle();
    if (lastBackdropId === style.id) return;
    lastBackdropId = style.id;
    var url = 'url(' + SC.makeStyleBackdrop(style).toDataURL('image/jpeg', 0.86) + ')';
    el.stageInner.style.opacity = '0';
    setTimeout(function () {
      el.stageInner.style.backgroundImage = url;
      el.stageInner.style.opacity = '1';
    }, 130);
  }

  /* 画布素材按风格染色（同一素材+风格+强度只处理一次；PNG 保留边缘羽化透明） */
  var stageImgKey = null;
  function refreshStageImage() {
    var m = app.materials[app.activeMaterial];
    if (!m) return;
    var style = currentStyle();
    var key = m.id + '|' + style.id + '|' + app.strength;
    if (stageImgKey === key) return;
    stageImgKey = key;
    var img = new Image();
    img.onload = function () {
      el.stageImg.src = SC.tintMaterialToStyle(img, style, app.strength).toDataURL('image/png');
    };
    img.src = m.src;
  }

  function renderPaper() {
    var show = (app.state === ST.RESULT || app.state === ST.RESULT_SMALL || app.state === ST.DISPLAY) && app.currentWork;
    if (!show) {
      el.paper.style.display = 'none';
      el.paper.classList.remove('slide-in', 'zoomed');
      return;
    }
    var src = app.compareActive ? materialSrc() : (app.state === ST.DISPLAY ? null : app.currentWork.dataURL);
    if (app.state === ST.DISPLAY) {
      /* 创意显示画布由 renderFx 管理 */
      el.paper.style.display = 'none';
      return;
    }
    el.paper.style.display = 'block';
    if (app.compareActive && src) {
      el.paperImg.src = src;
    } else if (!app.compareActive) {
      el.paperImg.src = app.currentWork.dataURL;
    }
    var actions = el.paper.querySelectorAll('[data-act]');
    for (var i = 0; i < actions.length; i++) {
      var act = actions[i].getAttribute('data-act');
      actions[i].style.display = (act === 'compare' && !materialSrc()) ? 'none' : '';
    }
  }

  /* ---------- 预览（素材 + 当前风格视觉） ---------- */
  function refreshPreview() {
    if (!hasMaterials()) return;
    el.fxCanvas.hidden = true;
    el.previewImg.style.display = '';
    SC.loadStyleVisual(currentStyle(), app.strength, materialSrc()).then(function (v) {
      if (v.match && v.match.style) app.detectedStyleId = v.match.style.id;
      var url = v.canvas ? v.canvas.toDataURL('image/jpeg', 0.86) : v.img.src;
      app.previewDataURL = url;
      el.previewImg.src = url;
      el.previewImg.classList.remove('pop');
      void el.previewImg.offsetWidth;
      el.previewImg.classList.add('pop');
    });
  }

  /* ---------- 生成 ---------- */
  function startGenerate() {
    if (!hasMaterials()) { toast('请先放入素材'); return; }
    if (app.state === ST.GENERATING) return;
    if (app.state === ST.RESULT || app.state === ST.RESULT_SMALL || app.state === ST.BROWSING || app.state === ST.STRENGTH) {
      app.state = ST.GENERATING;
      app.compareActive = false;
      renderStatus(); renderKeys();
      el.paper.style.display = 'none';
      var style = currentStyle();
      SC.loadStyleVisual(style, app.strength, materialSrc()).then(function (v) {
        var url = v.canvas ? v.canvas.toDataURL('image/jpeg', 0.86) : v.img.src;
        return sleep(1100).then(function () {
          app.currentWork = {
            dataURL: url,
            styleId: style.id,
            strength: app.strength,
            demo: v.demo || true
          };
          app.state = ST.RESULT;
          el.paperImg.src = url;
          el.paper.style.display = 'block';
          el.paper.classList.remove('zoomed');
          el.paper.classList.add('slide-in');
          return sleep(620);
        }).then(function () {
          el.paper.classList.remove('slide-in');
          el.paper.classList.add('zoomed');
          renderAll();
          toast('作品完成，' + (keyOf('save') || 'S3') + ' 保存或 ' + (keyOf('collapse') || 'S4') + ' 收起');
        });
      });
    } else {
      toast('当前状态不可生成');
    }
  }

  /* ---------- 创意显示 ---------- */
  function enterDisplay(targetSrc) {
    app.state = ST.DISPLAY;
    app.compareActive = false;
    app.displayEffect = 'dots';
    app.displayTarget = targetSrc;
    el.previewImg.style.display = 'none';
    el.fxCanvas.hidden = false;
    renderAll();
    var img = new Image();
    img.onload = function () {
      var info = SC.FX.render(el.fxCanvas, img, app.displayEffect, app.displayWin);
      app.displayWin = info.interactive ? { cx: info.cx, cy: info.cy, r: info.r, w: info.w, h: info.h } : null;
    };
    img.src = app.displayTarget;
  }

  function refreshFx() {
    if (app.state !== ST.DISPLAY || !app.displayTarget) return;
    var img = new Image();
    img.onload = function () {
      var info = SC.FX.render(el.fxCanvas, img, app.displayEffect, app.displayWin);
      app.displayWin = info.interactive ? { cx: info.cx, cy: info.cy, r: info.r, w: info.w, h: info.h } : null;
    };
    img.src = app.displayTarget;
  }

  function switchFx(delta) {
    var idx = SC.FX_EFFECTS.findIndex(function (e) { return e.id === app.displayEffect; });
    idx = (idx + delta + SC.FX_EFFECTS.length) % SC.FX_EFFECTS.length;
    app.displayEffect = SC.FX_EFFECTS[idx].id;
    app.displayWin = null;
    toast('创意显示：' + SC.FX_EFFECTS[idx].name);
    refreshFx();
  }

  /* ---------- 保存 ---------- */
  function saveCurrent() {
    var src = null, name = '';
    if (app.state === ST.DISPLAY && !el.fxCanvas.hidden) {
      src = el.fxCanvas.toDataURL('image/png');
      name = 'stylecam_fx_' + app.displayEffect + '_' + Date.now() + '.png';
    } else if (app.currentWork) {
      src = app.currentWork.dataURL;
      name = 'stylecam_' + app.currentWork.styleId + '_' + Date.now() + '.jpg';
    }
    if (!src) { toast('还没有可保存的作品'); return; }
    SC.Storage.exportDataURL(src, name);
    SC.Storage.prepareForStorage(src).then(function (small) {
      SC.Storage.saveWork({
        dataURL: small,
        styleId: app.currentWork ? app.currentWork.styleId : '',
        strength: app.currentWork ? app.currentWork.strength : app.strength,
        demo: true
      });
      renderWorks();
      toast('已保存并归档到作品区');
      if (app.state !== ST.DISPLAY) setState(ST.WORKBENCH);
    });
  }

  /* ---------- 主分发 ---------- */
  function dispatch(action) {
    var modalOpen = !el.inspireModal.hidden || !el.schemeModal.hidden || !el.tutorialModal.hidden;
    if (modalOpen) {
      if (!el.tutorialModal.hidden) return;
      if (action === 'inspire') { openInspire(); return; }
      if (action === 'mode') { openScheme(); return; }
      if (!el.inspireModal.hidden && (action === 'knobLeft' || action === 'knobRight')) {
        cycleInspireStyle(action === 'knobLeft' ? -1 : 1);
        return;
      }
      closeInspire();
      closeScheme();
      return;
    }
    var s = app.state;
    switch (action) {
      case 'knobLeft':
      case 'knobRight': {
        var dir = action === 'knobLeft' ? -1 : 1;
        rotateKnob(dir);
        if (s === ST.BROWSING) {
          app.styleIndex = (app.styleIndex + dir + app.styles.length) % app.styles.length;
          refreshPreview();
          renderStatus();
        } else if (s === ST.STRENGTH) {
          app.strength = clamp(app.strength + dir * 5, 0, 100);
          renderStrength(); renderStatus();
          refreshPreview();
        } else if (s === ST.MODE_SELECT) {
          app.mode = app.mode === 'generate' ? 'display' : 'generate';
          renderStatus();
          toast(app.mode === 'generate' ? '模式：风格生成' : '模式：创意显示');
        } else if (s === ST.DISPLAY) {
          switchFx(dir);
        }
        break;
      }
      case 'knobPress': {
        if (s === ST.STRENGTH) {
          setState(ST.BROWSING);
          toast('强度已确认：' + app.strength + '（' + strengthLabel(app.strength) + '）');
        } else if (s === ST.MODE_SELECT) {
          if (app.mode === 'display') enterDisplay(materialSrc());
          else setState(ST.BROWSING);
          toast('已确认模式：' + (app.mode === 'display' ? '创意显示' : '风格生成'));
        } else if (s === ST.BROWSING) {
          if (app.mode === 'display') enterDisplay(materialSrc());
          else startGenerate();
        } else if (s === ST.DISPLAY) {
          setState(ST.WORKBENCH);
        } else if (s === ST.WORKBENCH) {
          toast('请先放入素材');
        }
        break;
      }
      case 'generate': startGenerate(); break;
      case 'strength': {
        if (s === ST.BROWSING) { setState(ST.STRENGTH); toast('旋钮调节强度，短按确认'); }
        else if (s === ST.STRENGTH) setState(ST.BROWSING);
        else if (s === ST.RESULT || s === ST.RESULT_SMALL) toast('生成模式下请用生成键');
        break;
      }
      case 'view': {
        if (s === ST.RESULT) { app.state = ST.RESULT_SMALL; renderAll(); }
        else if (s === ST.RESULT_SMALL) { enterDisplay(app.currentWork.dataURL); }
        else if (s === ST.DISPLAY) { setState(ST.WORKBENCH); }
        else toast('先完成一次生成再查看');
        break;
      }
      case 'save': saveCurrent(); break;
      case 'collapse': {
        if (s === ST.RESULT) { enterDisplay(app.currentWork.dataURL); }
        else if (s === ST.RESULT_SMALL || s === ST.DISPLAY) { setState(ST.WORKBENCH); }
        break;
      }
      case 'compare': {
        if (s === ST.RESULT || s === ST.RESULT_SMALL) {
          if (!materialSrc()) { toast('原始素材已不在库中，无法对比'); return; }
          app.compareActive = !app.compareActive;
          renderStatus(); renderPaper();
        }
        break;
      }
      case 'inspire': openInspire(); break;
      case 'reset': {
        app.strength = 50;
        app.styleIndex = 0;
        app.compareActive = false;
        app.mode = 'generate';
        if (s === ST.RESULT || s === ST.RESULT_SMALL || s === ST.DISPLAY || s === ST.STRENGTH) {
          if (s === ST.DISPLAY) el.fxCanvas.hidden = true;
          setState(ST.BROWSING);
        } else {
          renderAll();
        }
        toast('已重置调节，素材与作品保留');
        break;
      }
      case 'mode': {
        if (s === ST.BROWSING) { setState(ST.MODE_SELECT); }
        else toast('浏览状态下按模式键切换');
        break;
      }
    }
  }
  SC.dispatch = dispatch;

  /* ---------- 旋钮动效 ---------- */
  var knobAngle = 0;
  function rotateKnob(dir) {
    knobAngle += dir * 22;
    el.knobCap.classList.add('rotating');
    el.knobCap.style.transform = 'rotate(' + knobAngle + 'deg)';
    setTimeout(function () { el.knobCap.classList.remove('rotating'); }, 130);
  }

  /* ---------- 灵感卡 ---------- */
  function renderInspireStyle() {
    var st = currentStyle();
    el.inspireStyleBtn.textContent = st.name + ' ▾';
    el.inspireStyleList.innerHTML = app.styles.map(function (s) {
      return '<li data-style-id="' + s.id + '"' + (s.id === st.id ? ' class="sel"' : '') + '>' + s.name + '</li>';
    }).join('');
    el.inspireStyleHint.textContent = app.detectedStyleId
      ? '自动识别样片风格：' + SC.styleById(app.detectedStyleId).name
      : '滚轮 / 旋钮 ←→ 切换';
  }
  function cycleInspireStyle(dir) {
    app.styleIndex = (app.styleIndex + dir + app.styles.length) % app.styles.length;
    renderInspireStyle();
    renderStatus();
    refreshPreview();
    toast('风格：' + currentStyle().name);
  }
  function applyInspireStyle(id) {
    var idx = app.styles.findIndex(function (s) { return s.id === id; });
    if (idx >= 0) {
      app.styleIndex = idx;
      renderInspireStyle();
      renderStatus();
      refreshPreview();
    }
  }
  function openInspire() {
    el.inspireList.innerHTML = INSPIRES.map(function (t) { return '<li>' + t + '</li>'; }).join('');
    if (app.detectedStyleId) {
      var idx = app.styles.findIndex(function (s) { return s.id === app.detectedStyleId; });
      if (idx >= 0) app.styleIndex = idx;
    }
    renderInspireStyle();
    el.inspireStyleList.hidden = true;
    el.inspireModal.hidden = false;
  }
  function closeInspire() {
    el.inspireStyleList.hidden = true;
    el.inspireModal.hidden = true;
  }

  /* ---------- 使用引导 ---------- */
  function openTutorial() { el.tutorialModal.hidden = false; }
  function closeTutorial() { el.tutorialModal.hidden = true; }
  function initTutorial() {
    if (!localStorage.getItem('stylecam_tutorial_shown')) {
      el.tutorialModal.hidden = false;
      localStorage.setItem('stylecam_tutorial_shown', 'true');
    }
  }

  /* ---------- 方案面板 ---------- */
  function openScheme() {
    var labels = { strength: '强度', view: '查看', save: '保存', collapse: '收起', compare: '对比', inspire: '灵感', reset: '重置', mode: '模式', generate: '生成' };
    var rows = [SC.schemeById('default'), SC.schemeById('custom')].map(function (sc) {
      var tds = ['<td>' + sc.name + '</td>'];
      for (var i = 1; i <= 8; i++) {
        var act = sc.keys['Digit' + i];
        tds.push('<td class="' + (sc.id === app.schemeId ? (sc.id === 'custom' ? 'cur custom' : 'cur') : '') + '">' + (act ? labels[act] : '—') + '</td>');
      }
      tds.push('<td>方向键</td><td>回车</td>');
      return '<tr>' + tds.join('') + '</tr>';
    });
    el.schemeTableBody.innerHTML = rows.join('');
    var cur = SC.schemeById(app.schemeId);
    el.schemeNote.textContent = '当前使用：' + cur.name + ' —— ' + cur.desc;
    el.schemeModal.hidden = false;
  }
  function switchScheme() {
    app.schemeId = app.schemeId === 'default' ? 'custom' : 'default';
    var sc = SC.schemeById(app.schemeId);
    toast('已切换到' + sc.name);
    el.schemeModal.hidden = false;
    openScheme();
    renderStatus(); renderKeys();
  }
  function closeScheme() { el.schemeModal.hidden = true; }

  /* ---------- 素材上传 ---------- */
  function addMaterials(files) {
    var list = Array.prototype.slice.call(files || []).slice(0, 4);
    if (!list.length) return;
    list.forEach(function (f) {
      if (!f.type || f.type.indexOf('image') !== 0) return;
      var reader = new FileReader();
      reader.onload = function (e) {
        app.materials.push({ id: Date.now() + '_' + Math.random().toString(36).slice(2, 6), src: e.target.result, name: f.name });
        if (app.materials.length === 1) app.activeMaterial = 0;
        if (app.state === ST.WORKBENCH) {
          app.state = ST.BROWSING;
          refreshPreview();
        } else {
          refreshPreview();
        }
        renderAll();
      };
      reader.readAsDataURL(f);
    });
  }

  function removeMaterial(idx) {
    app.materials.splice(idx, 1);
    if (app.activeMaterial >= app.materials.length) app.activeMaterial = Math.max(0, app.materials.length - 1);
    if (!app.materials.length) {
      app.state = ST.WORKBENCH;
      app.currentWork = null;
      el.paper.style.display = 'none';
      app.previewDataURL = null;
      el.previewImg.src = '';
    }
    renderAll();
  }

  /* ---------- 事件绑定 ---------- */
  function bindEvents() {
    document.addEventListener('keydown', function (e) {
      if (e.code === 'Escape') {
        e.preventDefault();
        closeInspire();
        closeScheme();
        closeTutorial();
        return;
      }
      var action = SC.actionFromCode(e.code, app.schemeId);
      if (!action) return;
      e.preventDefault();
      var key = SC.codeToKey(e.code);
      if (key) pulseKey(key);
      dispatch(action);
    });

    el.keysZone.addEventListener('click', function (e) {
      var keyEl = e.target.closest('.key');
      if (!keyEl) return;
      pulseKey(keyEl.querySelector('.key-cap').textContent);
      dispatch(keyEl.getAttribute('data-action'));
    });

    el.knobCap.parentElement.addEventListener('click', function (e) {
      var hit = e.target.closest('.knob-hit');
      if (!hit) return;
      dispatch(hit.getAttribute('data-knob') === 'press' ? 'knobPress' : (hit.getAttribute('data-knob') === 'left' ? 'knobLeft' : 'knobRight'));
    });

    el.btnGenerate.addEventListener('click', function () { dispatch('generate'); });

    el.styleGallery.addEventListener('click', function (e) {
      var card = e.target.closest('.style-card');
      if (!card) return;
      var idx = app.styles.findIndex(function (s) { return s.id === card.getAttribute('data-style-id'); });
      if (idx < 0 || idx === app.styleIndex) return;
      app.styleIndex = idx;
      updateStageBackdrop();
      refreshPreview();
      renderStatus();
      toast('风格：' + currentStyle().name);
    });

    /* 创意强度滑条：鼠标 / 触屏拖拽，与旋钮键盘通道并存 */
    function strengthFromClientX(clientX) {
      var rect = el.strengthTrack.getBoundingClientRect();
      var p = (clientX - rect.left) / rect.width;
      return clamp(Math.round(p * 100), 0, 100);
    }
    var strengthDragging = false;
    function setStrengthLive(v) {
      app.strength = v;
      renderStrength();
      el.previewStrength.textContent = '强度 ' + strengthLabel(v) + ' ' + v;
    }
    function commitStrength() {
      renderStatus();
      toast('强度已设为 ' + app.strength + '（' + strengthLabel(app.strength) + '）');
      if (hasMaterials()) refreshPreview();
    }
    el.strengthTrack.addEventListener('pointerdown', function (e) {
      strengthDragging = true;
      try { el.strengthTrack.setPointerCapture(e.pointerId); } catch (err) {}
      setStrengthLive(strengthFromClientX(e.clientX));
    });
    el.strengthTrack.addEventListener('pointermove', function (e) {
      if (!strengthDragging) return;
      setStrengthLive(strengthFromClientX(e.clientX));
    });
    el.strengthTrack.addEventListener('pointerup', function () {
      if (!strengthDragging) return;
      strengthDragging = false;
      commitStrength();
    });
    el.strengthTrack.addEventListener('pointercancel', function () {
      strengthDragging = false;
    });

    /* 灵感面板：滚轮切换风格、下拉选择、点遮罩关闭 */
    el.inspireModal.addEventListener('wheel', function (e) {
      if (el.inspireModal.hidden) return;
      if (!el.inspireStyleList.hidden && el.inspireStyleList.contains(e.target)) return;
      e.preventDefault();
      cycleInspireStyle(e.deltaY > 0 ? 1 : -1);
    }, { passive: false });
    el.inspireStyleBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (el.inspireModal.hidden) return;
      el.inspireStyleList.hidden = !el.inspireStyleList.hidden;
    });
    el.inspireStyleList.addEventListener('click', function (e) {
      var li = e.target.closest('li');
      if (!li) return;
      applyInspireStyle(li.getAttribute('data-style-id'));
      el.inspireStyleList.hidden = true;
    });
    el.inspireModal.addEventListener('click', function (e) {
      if (e.target === el.inspireModal) closeInspire();
    });
    el.paper.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      dispatch(btn.getAttribute('data-act'));
    });

    el.btnScheme.addEventListener('click', openScheme);
    $('btnCloseScheme').addEventListener('click', closeScheme);
    $('btnSwitchScheme').addEventListener('click', switchScheme);
    el.schemeModal.addEventListener('click', function (e) { if (e.target === el.schemeModal) closeScheme(); });
    $('btnCloseInspire').addEventListener('click', closeInspire);
    el.inspireModal.addEventListener('click', function (e) { if (e.target === el.inspireModal) closeInspire(); });

    el.btnHelp.addEventListener('click', openTutorial);
    $('btnCloseTutorial').addEventListener('click', closeTutorial);
    $('btnStartTutorial').addEventListener('click', function () {
      closeTutorial();
      el.uploadZone.classList.add('spotlight');
      setTimeout(function () { el.uploadZone.classList.remove('spotlight'); }, 1600);
      toast('现在请放入你的素材，开始创作吧');
    });
    el.tutorialModal.addEventListener('click', function (e) { if (e.target === el.tutorialModal) closeTutorial(); });

    el.fileInput.addEventListener('change', function () { addMaterials(el.fileInput.files); el.fileInput.value = ''; });

    el.btnSample.addEventListener('click', function () {
      var c = document.createElement('canvas');
      c.width = 480; c.height = 360;
      var x = c.getContext('2d');
      var g = x.createLinearGradient(0, 0, 480, 360);
      g.addColorStop(0, '#ff9a76'); g.addColorStop(1, '#7a4a86');
      x.fillStyle = g; x.fillRect(0, 0, 480, 360);
      x.fillStyle = '#fff'; x.beginPath(); x.arc(240, 180, 80, 0, Math.PI * 2); x.fill();
      app.materials = [{ id: 'sample', src: c.toDataURL('image/png'), name: '示例素材.png' }];
      app.activeMaterial = 0;
      app.state = ST.BROWSING;
      refreshPreview();
      renderAll();
      toast('已加载示例素材，开始创作吧');
    });

    el.uploadZone.addEventListener('click', function (e) { if (e.target !== el.fileInput) el.fileInput.click(); });
    el.uploadZone.addEventListener('dragover', function (e) { e.preventDefault(); el.uploadZone.classList.add('dragover'); });
    el.uploadZone.addEventListener('dragleave', function () { el.uploadZone.classList.remove('dragover'); });
    el.uploadZone.addEventListener('drop', function (e) {
      e.preventDefault();
      el.uploadZone.classList.remove('dragover');
      addMaterials(e.dataTransfer.files);
    });

    el.materialStrip.addEventListener('click', function (e) {
      var close = e.target.closest('.thumb-close');
      var thumb = e.target.closest('.thumb');
      if (!thumb) return;
      var idx = parseInt(thumb.getAttribute('data-idx'), 10);
      if (close) removeMaterial(idx);
      else if (idx !== app.activeMaterial) {
        app.activeMaterial = idx;
        renderMaterials();
        refreshPreview();
      }
    });

    el.worksGrid.addEventListener('click', function (e) {
      var card = e.target.closest('.work-card');
      if (!card) return;
      var works = SC.Storage.getWorks();
      var w = works.find(function (x) { return String(x.id) === card.getAttribute('data-id'); });
      if (!w) return;
      app.currentWork = { dataURL: w.dataURL, styleId: w.styleId, strength: w.strength, demo: true };
      app.state = ST.RESULT;
      el.paper.style.display = 'block';
      el.paper.classList.remove('slide-in', 'zoomed');
      el.paperImg.src = w.dataURL;
      renderAll();
    });

    /* 显影窗口拖拽 */
    el.fxCanvas.addEventListener('pointerdown', function (e) {
      if (app.displayEffect !== 'window' || !app.displayWin) return;
      el.fxCanvas.setPointerCapture(e.pointerId);
      moveWindow(e);
    });
    el.fxCanvas.addEventListener('pointermove', function (e) {
      if (e.buttons !== 1 || app.displayEffect !== 'window' || !app.displayWin) return;
      moveWindow(e);
    });
  }

  function moveWindow(e) {
    var rect = el.fxCanvas.getBoundingClientRect();
    var win = app.displayWin;
    var cx = clamp((e.clientX - rect.left) / rect.width * win.w, 0, win.w);
    var cy = clamp((e.clientY - rect.top) / rect.height * win.h, 0, win.h);
    app.displayWin.cx = cx;
    app.displayWin.cy = cy;
    refreshFx();
  }

  function pulseKey(keyLabel) {
    var caps = el.keysZone.querySelectorAll('.key-cap');
    caps.forEach(function (c) {
      if (c.textContent === keyLabel) {
        var k = c.closest('.key');
        k.classList.add('pulse');
        setTimeout(function () { k.classList.remove('pulse'); }, 520);
      }
    });
  }

  /* ---------- 启动 ---------- */
  function init() {
    renderStyleGallery();
    bindEvents();
    renderAll();
    if (!hasMaterials()) {
      el.previewImg.style.display = 'none';
      el.stageImg.style.display = 'none';
    }
  }

  SC.app = app;
  SC.init = init;
  SC.toast = toast;
  SC.initTutorial = initTutorial;
  SC.refresh = function () { renderAll(); refreshPreview(); };
})(window.StyleCam);

document.addEventListener('DOMContentLoaded', function () {
  window.StyleCam.init();
  window.StyleCam.initTutorial();
});
