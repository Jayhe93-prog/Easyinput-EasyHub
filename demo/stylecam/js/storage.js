/* ============ StyleCam 作品保存与历史记录 ============ */
window.StyleCam = window.StyleCam || {};

(function (SC) {
  'use strict';

  var KEY = 'stylecam_works';

  function loadImage(src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { resolve(null); };
      img.src = src;
    });
  }

  function compress(dataURL, maxW) {
    return loadImage(dataURL).then(function (img) {
      if (!img) return dataURL;
      var scale = Math.min(1, maxW / img.width);
      var c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      return c.toDataURL('image/jpeg', 0.82);
    });
  }

  SC.Storage = {
    saveWork: function (work) {
      var works = this.getWorks();
      work = Object.assign({ id: Date.now() + '_' + Math.floor(Math.random() * 9999), createdAt: Date.now() }, work);
      works.unshift(work);
      while (works.length > 12) works.pop();
      try {
        localStorage.setItem(KEY, JSON.stringify(works));
      } catch (e) {
        /* 存储满时退回内存态 */
      }
      return work;
    },
    getWorks: function () {
      try {
        return JSON.parse(localStorage.getItem(KEY)) || [];
      } catch (e) {
        return [];
      }
    },
    clearWorks: function () {
      try { localStorage.removeItem(KEY); } catch (e) { /* noop */ }
    },
    /* 作品入库前压缩，控制存储体积 */
    prepareForStorage: function (dataURL) {
      return compress(dataURL, 560);
    },
    /* 触发浏览器下载 */
    exportDataURL: function (dataURL, filename) {
      var a = document.createElement('a');
      a.href = dataURL;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  };
})(window.StyleCam);
