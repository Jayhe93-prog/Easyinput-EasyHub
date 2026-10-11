/* ============ StyleCam 风格配方数据与本地演示样片生成 ============ */
window.StyleCam = window.StyleCam || {};

(function (SC) {
  'use strict';

  SC.STYLES = [
    { id: 'knit',          name: '毛线旅行家', tagline: '织成掌心里的温柔', palette: ['#e8a0b8', '#f6d7a8', '#a86a8a'], pattern: 'weave' },
    { id: 'bricks',        name: '积木星球',   tagline: '一块一块搭出另一个宇宙', palette: ['#f2a65a', '#f7d08a', '#7a4a86'], pattern: 'geo' },
    { id: 'mecha',         name: '机甲模型盒', tagline: '把日常装配成未来收藏品', palette: ['#5a6b8c', '#9aa8c2', '#3a4662'], pattern: 'panel' },
    { id: 'retro',         name: '掌上像素梦', tagline: '把世界装进小小掌机', palette: ['#3ec47a', '#2a2a38', '#e8f25e'], pattern: 'dots' },
    { id: 'clay',          name: '软陶盲盒',   tagline: '捏一份柔软的想象', palette: ['#f4a7a0', '#fbd9a6', '#8fd0c9'], pattern: 'blob' },
    { id: 'paper',         name: '纸间剧场',   tagline: '折叠光影，让画面站起来', palette: ['#f7ead0', '#d9b98c', '#9a6a4a'], pattern: 'fold' },
    { id: 'liquid',        name: '液态银诗',   tagline: '让轮廓流动，光成为颜色', palette: ['#9fb8d9', '#e0d7f2', '#4a5878'], pattern: 'flow' },
    { id: 'jelly',         name: '果冻宇宙',   tagline: '给世界一点透明、轻盈和弹性', palette: ['#7fd8d2', '#f2a8d2', '#a8c8f2'], pattern: 'bubble' },
    { id: 'terrarium',     name: '口袋生态舱', tagline: '把小世界藏进玻璃球', palette: ['#7fb069', '#c9df8a', '#3a5a40'], pattern: 'bubble' },
    { id: 'screenprint',   name: '孔版夏日',   tagline: '留住油墨颗粒里的夏天', palette: ['#ff8a50', '#ffe9c9', '#e8590c'], pattern: 'halftone' }
  ];

  SC.PERSONAL_STYLES = [
    { id: 'custom-plush', name: '我的毛绒宇宙', tagline: '个人风格：柔软手作的温暖感', palette: ['#c9a7eb', '#f7d6e0', '#8b5fbf'], pattern: 'weave', personal: true }
  ];

  SC.allStyles = function () {
    return SC.STYLES.concat(SC.PERSONAL_STYLES);
  };

  SC.styleById = function (id) {
    return SC.allStyles().find(function (s) { return s.id === id; }) || SC.STYLES[0];
  };

  /* 用户样片路径约定：assets/styles/<styleId>/sample.png（可放 1~3 张，命名 sample.png / low.png / mid.png / high.png） */
  SC.assetPath = function (styleId, strengthLevel) {
    var name = strengthLevel ? strengthLevel + '.png' : 'sample.png';
    return 'assets/styles/' + styleId + '/' + name;
  };

  /* ---------- 本地演示风格化合成 ---------- */
  var patterns = {
    dots: function (ctx, w, h, c) {
      ctx.fillStyle = c;
      for (var y = 8; y < h; y += 18) {
        for (var x = 8; x < w; x += 18) {
          ctx.beginPath(); ctx.arc(x, y, 3.4, 0, Math.PI * 2); ctx.fill();
        }
      }
    },
    geo: function (ctx, w, h, c) {
      ctx.fillStyle = c;
      var s = 44;
      for (var y = 0; y < h + s; y += s) {
        for (var x = 0; x < w + s; x += s) {
          if ((x / s + y / s) % 2 === 0) {
            ctx.fillRect(x, y, s, s);
          }
        }
      }
    },
    weave: function (ctx, w, h, c) {
      ctx.fillStyle = c;
      var s = 22;
      for (var y = 0; y < h; y += s) {
        for (var x = 0; x < w; x += s) {
          if ((x / s + y / s) % 2 === 0) {
            ctx.fillRect(x, y, s, s);
          }
        }
      }
    },
    panel: function (ctx, w, h, c) {
      ctx.strokeStyle = c;
      ctx.lineWidth = 3;
      var s = 52;
      for (var y = s / 2; y < h; y += s) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
      for (var x = s / 2; x < w; x += s) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      ctx.lineWidth = 6;
      ctx.strokeRect(0, 0, w, h);
    },
    blob: function (ctx, w, h, c) {
      ctx.fillStyle = c;
      for (var i = 0; i < 9; i++) {
        var x = (i * 97 + 23) % w, y = (i * 151 + 41) % h, r = 26 + (i % 3) * 12;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
    },
    fold: function (ctx, w, h, c) {
      ctx.strokeStyle = c;
      ctx.lineWidth = 2;
      var s = 60;
      for (var y = -h; y < h * 2; y += s) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y + w * 0.7); ctx.stroke();
      }
    },
    flow: function (ctx, w, h, c) {
      ctx.fillStyle = c;
      for (var i = 0; i < 7; i++) {
        var y = h * (0.12 + i * 0.13);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(w * 0.3, y - 34, w * 0.7, y + 34, w, y - 10);
        ctx.lineTo(w, y + 26);
        ctx.bezierCurveTo(w * 0.7, y + 60, w * 0.3, y - 8, 0, y + 34);
        ctx.closePath();
        ctx.fill();
      }
    },
    bubble: function (ctx, w, h, c) {
      ctx.strokeStyle = c;
      ctx.lineWidth = 2.4;
      for (var i = 0; i < 10; i++) {
        var x = (i * 131 + 17) % w, y = (i * 89 + 29) % h, r = 14 + (i % 4) * 9;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.18, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill();
      }
    },
    halftone: function (ctx, w, h, c) {
      ctx.fillStyle = c;
      var step = 12;
      for (var y = step / 2; y < h; y += step) {
        for (var x = step / 2; x < w; x += step) {
          var d = Math.min(4.6, (Math.sin(x * 0.05) * Math.cos(y * 0.06) + 1) * 2.4 + 0.8);
          ctx.beginPath(); ctx.arc(x, y, d, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
  };

  function strengthLevel(s) {
    return s < 34 ? 'low' : (s < 67 ? 'mid' : 'high');
  }

  SC.strengthLevel = strengthLevel;

  function loadImage(src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { resolve(null); };
      img.src = src;
    });
  }

  /* 生成一张"风格化示意卡"：风格渐变背景 + 双层图案 + 圆形头像素材 + 底部风格名条 */
  SC.makeStyleCard = function (style, strength, materialSrc) {
    var canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    var ctx = canvas.getContext('2d');
    var g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    g.addColorStop(0, style.palette[0]);
    g.addColorStop(0.5, style.palette[1]);
    g.addColorStop(1, style.palette[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    var rg = ctx.createRadialGradient(320, 170, 40, 320, 170, 430);
    rg.addColorStop(0, 'rgba(255,255,255,.32)');
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    var pattern = patterns[style.pattern] || patterns.dots;
    ctx.globalAlpha = 0.12 + strength / 300;
    pattern(ctx, canvas.width, canvas.height, '#ffffff');
    ctx.globalAlpha = 0.10;
    pattern(ctx, canvas.width, canvas.height, '#1a1410');
    ctx.globalAlpha = 1;

    var BAR = 78;
    var done = function (mat) {
      if (mat) {
        var mSrc = SC.hasTransparency(mat) ? SC.trimTransparent(mat) : mat;
        var iw = mSrc.width || mSrc.naturalWidth || 1, ih = mSrc.height || mSrc.naturalHeight || 1;
        var cx = canvas.width / 2, cy = (canvas.height - BAR) / 2;
        var dia = Math.min(canvas.width, canvas.height - BAR) * 0.78;
        var r = dia / 2;
        /* cover 圆形：竖版偏上露头，方图/横版居中完整 */
        var sc = Math.max(dia / iw, dia / ih);
        var mw = iw * sc, mh = ih * sc;
        var mx = cx - mw / 2;
        var my = (ih > iw) ? cy - mh * 0.33 : cy - mh / 2;

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(mSrc, mx, my, mw, mh);
        var a = strength / 100;
        if (a > 0.03) {
          ctx.globalCompositeOperation = 'soft-light';
          ctx.globalAlpha = a * 0.72;
          ctx.fillStyle = g;
          ctx.fillRect(mx, my, mw, mh);
          ctx.globalCompositeOperation = 'multiply';
          ctx.globalAlpha = a * 0.22;
          ctx.fillRect(mx, my, mw, mh);
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = 'source-over';
        }
        ctx.restore();

        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(255,255,255,.9)';
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(0,0,0,.18)';
        ctx.beginPath(); ctx.arc(cx, cy, r + 0.5, 0, Math.PI * 2); ctx.stroke();
      }

      ctx.fillStyle = 'rgba(24,18,12,.55)';
      ctx.fillRect(0, canvas.height - BAR, canvas.width, BAR);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 30px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText(style.name, canvas.width / 2, canvas.height - 36);
      ctx.font = '15px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,.78)';
      ctx.fillText(style.tagline, canvas.width / 2, canvas.height - 12);
      return canvas;
    };

    if (materialSrc) {
      return loadImage(materialSrc).then(function (img) {
        return done(img);
      });
    }
    return Promise.resolve(done(null));
  };

  /* ---------- 样片风格识别与实时风格化 ---------- */
  function hexToRgb(hex) {
    var n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  /* 采样样片主色调，匹配风格库中最接近的风格（不限定样片内容） */
  SC.analyzeImageStyle = function (img) {
    try {
      var c = document.createElement('canvas');
      c.width = 8; c.height = 8;
      var ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, 8, 8);
      var d = ctx.getImageData(0, 0, 8, 8).data;
      var r = 0, g = 0, b = 0, n = 0;
      for (var i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
      r /= n; g /= n; b /= n;
      var best = null, bestDist = Infinity;
      SC.allStyles().forEach(function (st) {
        st.palette.forEach(function (hex) {
          var p = hexToRgb(hex);
          var dist = Math.sqrt((r - p[0]) * (r - p[0]) + (g - p[1]) * (g - p[1]) + (b - p[2]) * (b - p[2]));
          if (dist < bestDist) { bestDist = dist; best = st; }
        });
      });
      return { style: best, distance: bestDist };
    } catch (e) { return null; }
  };

  /* 单张样片实时风格化：原图叠加风格主色罩与图案，强度越高越风格化 */
  function styleSampleCanvas(img, style, strength) {
    var c = document.createElement('canvas');
    c.width = img.naturalWidth || img.width;
    c.height = img.naturalHeight || img.height;
    var ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    var a = strength / 100;
    if (a > 0.02) {
      var g = ctx.createLinearGradient(0, 0, c.width, c.height);
      g.addColorStop(0, style.palette[0]);
      g.addColorStop(0.5, style.palette[1]);
      g.addColorStop(1, style.palette[2]);
      ctx.globalAlpha = a * 0.5;
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.globalAlpha = a * 0.4;
      (patterns[style.pattern] || patterns.dots)(ctx, c.width, c.height, '#ffffff');
      ctx.globalAlpha = 1;
    }
    return c;
  }

  /* 风格背景画布：渐变 + 光晕 + 图案，供画布底纹与画廊卡片使用 */
  SC.makeStyleBackdrop = function (style) {
    var canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 560;
    var ctx = canvas.getContext('2d');
    var g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    g.addColorStop(0, style.palette[0]);
    g.addColorStop(0.5, style.palette[1]);
    g.addColorStop(1, style.palette[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    var rg = ctx.createRadialGradient(canvas.width / 2, canvas.height * 0.42, 60, canvas.width / 2, canvas.height * 0.42, canvas.width * 0.62);
    rg.addColorStop(0, 'rgba(255,255,255,.30)');
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    var pattern = patterns[style.pattern] || patterns.dots;
    ctx.globalAlpha = 0.16;
    pattern(ctx, canvas.width, canvas.height, '#ffffff');
    ctx.globalAlpha = 0.08;
    pattern(ctx, canvas.width, canvas.height, '#1a1410');
    ctx.globalAlpha = 1;
    return canvas;
  };

  /* 判断图片是否带透明通道（抠图素材） */
  SC.hasTransparency = function (img) {
    try {
      var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
      if (!w || !h) return false;
      var c = document.createElement('canvas');
      c.width = w; c.height = h;
      var ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      var d = ctx.getImageData(0, 0, w, h).data;
      var pts = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1], [w >> 1, 0], [w >> 1, h - 1], [0, h >> 1], [w - 1, h >> 1]];
      for (var i = 0; i < pts.length; i++) {
        if (d[(pts[i][1] * w + pts[i][0]) * 4 + 3] < 250) return true;
      }
      return false;
    } catch (e) { return false; }
  };

  /* 裁掉透明边缘留白，返回紧凑画布；无透明时原样返回 */
  SC.trimTransparent = function (img) {
    var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
    if (!w || !h) return img;
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    var d = ctx.getImageData(0, 0, w, h).data;
    var minX = w, minY = h, maxX = -1, maxY = -1;
    for (var y = 0; y < h; y += 4) {
      for (var x = 0; x < w; x += 4) {
        if (d[(y * w + x) * 4 + 3] > 8) {
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0) return img;
    var tw = maxX - minX + 1, th = maxY - minY + 1;
    var out = document.createElement('canvas');
    out.width = tw; out.height = th;
    out.getContext('2d').drawImage(c, minX, minY, tw, th, 0, 0, tw, th);
    return out;
  };

  /* 素材风格化染色：整张素材叠上风格主色调，保持完整矩形、不做圆形羽化；抠图素材自动去留白 */
  SC.tintMaterialToStyle = function (img, style, strength, feather) {
    var transparent = SC.hasTransparency(img);
    var src = transparent ? SC.trimTransparent(img) : img;
    var c = document.createElement('canvas');
    c.width = src.width || src.naturalWidth || 1;
    c.height = src.height || src.naturalHeight || 1;
    var ctx = c.getContext('2d');
    ctx.drawImage(src, 0, 0);
    var a = strength / 100;
    if (a > 0.03) {
      var g = ctx.createLinearGradient(0, 0, c.width, c.height);
      g.addColorStop(0, style.palette[0]);
      g.addColorStop(0.5, style.palette[1]);
      g.addColorStop(1, style.palette[2]);
      ctx.globalCompositeOperation = 'soft-light';
      ctx.globalAlpha = a * 0.72;
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = a * 0.22;
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
    return c;
  };

  /* 尽力加载用户样片；只有单张样片时按强度实时风格化；失败则回退到风格化示意卡 */
  SC.loadStyleVisual = function (style, strength, materialSrc) {
    var level = strengthLevel(strength);
    return loadImage(SC.assetPath(style.id, level)).then(function (img) {
      if (img) return { img: img, demo: false };
      return loadImage(SC.assetPath(style.id)).then(function (img2) {
        if (img2) {
          var match = SC.analyzeImageStyle(img2);
          var target = match && match.style ? match.style : style;
          return { img: img2, canvas: styleSampleCanvas(img2, target, strength), demo: false, match: match };
        }
        return SC.makeStyleCard(style, strength, materialSrc).then(function (card) {
          return { canvas: card, demo: true };
        });
      });
    });
  };
})(window.StyleCam);
