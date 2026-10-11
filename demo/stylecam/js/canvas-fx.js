/* ============ StyleCam 创意显示：本地实时效果 ============ */
window.StyleCam = window.StyleCam || {};

(function (SC) {
  'use strict';

  SC.FX_EFFECTS = [
    { id: 'dots',   name: '点阵' },
    { id: 'pixels', name: '像素' },
    { id: 'ascii',  name: '字符' },
    { id: 'window', name: '显影窗口' }
  ];

  function fitCanvas(canvas, img, maxW) {
    var scale = Math.min(1, maxW / img.width);
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    return canvas;
  }

  function sampleGrid(img, cell) {
    var w = img.width, h = img.height;
    var tmp = document.createElement('canvas');
    tmp.width = w; tmp.height = h;
    var tctx = tmp.getContext('2d');
    tctx.drawImage(img, 0, 0);
    var data = tctx.getImageData(0, 0, w, h).data;
    return {
      w: w, h: h, data: data,
      at: function (x, y) {
        var i = (Math.min(Math.floor(y), h - 1) * w + Math.min(Math.floor(x), w - 1)) * 4;
        return [data[i], data[i + 1], data[i + 2]];
      }
    };
  }

  function renderDots(ctx, img, cell) {
    var s = sampleGrid(img, cell);
    var w = s.w, h = s.h;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#f7f4ee';
    ctx.fillRect(0, 0, w, h);
    var r = Math.max(1.4, cell * 0.42);
    for (var y = cell / 2; y < h; y += cell) {
      for (var x = cell / 2; x < w; x += cell) {
        var c = s.at(x, y);
        ctx.fillStyle = 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function renderPixels(ctx, img, cell) {
    var s = sampleGrid(img, cell);
    var w = s.w, h = s.h;
    ctx.clearRect(0, 0, w, h);
    for (var y = 0; y < h; y += cell) {
      for (var x = 0; x < w; x += cell) {
        var c = s.at(x + cell / 2, y + cell / 2);
        ctx.fillStyle = 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
        ctx.fillRect(x, y, cell + 1, cell + 1);
      }
    }
  }

  var ASCII_RAMP = '@%#*+=-:. ';
  function renderAscii(ctx, img, cell) {
    var w = img.width, h = img.height;
    var gray = document.createElement('canvas');
    gray.width = w; gray.height = h;
    var gctx = gray.getContext('2d');
    gctx.drawImage(img, 0, 0);
    var imgData = gctx.getImageData(0, 0, w, h).data;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#f2efe8';
    ctx.fillRect(0, 0, w, h);
    ctx.font = 'bold ' + cell + 'px "Consolas", "Menlo", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (var y = 0; y < h; y += cell) {
      for (var x = 0; x < w; x += cell) {
        var i = (Math.min(Math.floor(y), h - 1) * w + Math.min(Math.floor(x), w - 1)) * 4;
        var lum = 0.299 * imgData[i] + 0.587 * imgData[i + 1] + 0.114 * imgData[i + 2];
        var ch = ASCII_RAMP[Math.floor(lum / 256 * ASCII_RAMP.length)];
        var d = imgData[i] + imgData[i + 1] + imgData[i + 2];
        ctx.fillStyle = d > 480 ? '#3a352c' : (d > 240 ? '#6b6455' : '#9a9080');
        ctx.fillText(ch, x + cell / 2, y + cell / 2);
      }
    }
  }

  function renderWindow(ctx, img, cx, cy, r) {
    var w = img.width, h = img.height;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0);
    var grey = document.createElement('canvas');
    grey.width = w; grey.height = h;
    var gctx = grey.getContext('2d');
    gctx.drawImage(img, 0, 0);
    var data = gctx.getImageData(0, 0, w, h);
    var px = data.data;
    for (var i = 0; i < px.length; i += 4) {
      var lum = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
      px[i] = px[i + 1] = px[i + 2] = lum;
    }
    gctx.putImageData(data, 0, 0);
    ctx.drawImage(grey, 0, 0);

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0);
    ctx.restore();

    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255,255,255,.9)';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(0,0,0,.35)';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('拖动圆窗移动显影位置', w / 2, h - 14);
  }

  SC.FX = {
    effects: SC.FX_EFFECTS,
    effectById: function (id) {
      return SC.FX_EFFECTS.find(function (e) { return e.id === id; }) || SC.FX_EFFECTS[0];
    },
    /* 返回是否使用了显影窗口（需交互） */
    render: function (canvas, img, effectId, opts) {
      var ctx = canvas.getContext('2d');
      fitCanvas(canvas, img, 620);
      var w = canvas.width, h = canvas.height;
      var cell = Math.max(6, Math.round(Math.max(w, h) / 90));
      var o = opts || {};
      var cx = o.cx == null ? w / 2 : o.cx;
      var cy = o.cy == null ? h / 2 : o.cy;
      var r = o.r == null ? Math.min(w, h) * 0.3 : o.r;
      switch (effectId) {
        case 'pixels': renderPixels(ctx, img, cell); break;
        case 'ascii':  renderAscii(ctx, img, cell); break;
        case 'window': renderWindow(ctx, img, cx, cy, r); return { interactive: true, cx: cx, cy: cy, r: r, w: w, h: h };
        default:       renderDots(ctx, img, cell); break;
      }
      return { interactive: false, w: w, h: h };
    }
  };
})(window.StyleCam);
