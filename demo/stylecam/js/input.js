/* ============ StyleCam 输入分发层：默认/自定义双方案 ============ */
window.StyleCam = window.StyleCam || {};

(function (SC) {
  'use strict';

  var actions = {
    strength:  '强度',
    view:      '查看',
    save:      '保存',
    collapse:  '收起',
    compare:   '对比',
    inspire:   '灵感',
    reset:     '重置',
    mode:      '模式',
    generate:  '生成',
    knobLeft:  '左旋',
    knobRight: '右旋',
    knobPress: '短按'
  };

  SC.ACTION_LABEL = actions;

  SC.SCHEMES = {
    default: {
      id: 'default',
      name: '课程标准方案',
      desc: '按功能编号罗列，与课堂操作表一致',
      keys: {
        Digit1: 'strength',
        Digit2: 'view',
        Digit3: 'save',
        Digit4: 'collapse',
        Digit5: 'compare',
        Digit6: 'inspire',
        Digit7: 'reset',
        Digit8: 'mode'
      }
    },
    custom: {
      id: 'custom',
      name: '节奏分区方案',
      desc: '按创作节奏重排：生成→查看→保存→收起，常用操作集中在前排',
      keys: {
        Digit1: 'generate',
        Digit2: 'view',
        Digit3: 'save',
        Digit4: 'collapse',
        Digit5: 'compare',
        Digit6: 'inspire',
        Digit7: 'reset'
      }
    }
  };

  SC.schemeById = function (id) {
    return SC.SCHEMES[id] || SC.SCHEMES.default;
  };

  /* 从键盘事件 code 解析动作（旋钮按键为公共映射） */
  SC.actionFromCode = function (code, schemeId) {
    var scheme = SC.schemeById(schemeId);
    if (scheme.keys[code]) return scheme.keys[code];
    if (code === 'ArrowLeft') return 'knobLeft';
    if (code === 'ArrowRight') return 'knobRight';
    if (code === 'Enter') return 'knobPress';
    return null;
  };

  /* 当前方案下 S1~S8 各键对应的动作名（空键位返回空动作） */
  SC.schemeKeyLabels = function (schemeId) {
    var scheme = SC.schemeById(schemeId);
    var labels = [];
    for (var i = 1; i <= 8; i++) {
      var action = scheme.keys['Digit' + i] || '';
      labels.push({ action: action, label: action ? (actions[action] || action) : '' });
    }
    return labels;
  };

  SC.codeToKey = function (code) {
    var m = /^Digit([1-8])$/.exec(code);
    return m ? 'S' + m[1] : null;
  };
})(window.StyleCam);
