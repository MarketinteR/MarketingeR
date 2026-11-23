/*
 * Gyakorlat-ábrák SVG-ben. A figura Apu testét mutatja: jobb kar könyök fölött, bal láb térd fölött csonk.
 * Az "a" és "b" póz között egyszerű áttűnéses animáció mutatja a mozdulatot (gyenge tableten is olcsó).
 */
(function (root) {
  var C = { body: '#d5e1f2', back: '#7f93b3', active: '#ff9f1c', bed: '#22324d', bedTop: '#2f4468', pillow: '#3b5480', roll: '#2ec4b6', floor: '#3a4d6e', walker: '#9fb3cf' };

  var VIEWS = {
    supine: {
      vb: '0 0 320 190', front: 'r',
      base: { head: [48, 110], neck: [66, 118], pel: [160, 122], lsh: [76, 120], rsh: [76, 120], relb: [102, 124], lelb: [106, 127], lhand: [138, 129], lhip: [160, 124], rhip: [160, 124], rknee: [214, 126], rank: [266, 127], rtoe: [272, 110], lstub: [196, 124] },
      scene: function () {
        return '<rect x="8" y="138" width="304" height="22" rx="8" fill="' + C.bedTop + '"/>' +
          '<rect x="16" y="160" width="10" height="22" fill="' + C.bed + '"/><rect x="294" y="160" width="10" height="22" fill="' + C.bed + '"/>' +
          '<ellipse cx="46" cy="130" rx="30" ry="9" fill="' + C.pillow + '"/>';
      }
    },
    prone: {
      vb: '0 0 320 190', front: 'l',
      base: { head: [46, 116], neck: [64, 121], pel: [160, 122], lsh: [76, 122], rsh: [76, 122], relb: [98, 127], lelb: [86, 129], lhand: [50, 131], lhip: [160, 124], rhip: [160, 124], rknee: [214, 126], rank: [266, 127], rtoe: [278, 133], lstub: [196, 124] },
      scene: function () { return VIEWS.supine.scene(); }
    },
    top: {
      vb: '0 30 320 140', front: null, wide: true,
      base: { head: [46, 100], neck: [64, 100], pel: [160, 100], lsh: [76, 84], rsh: [76, 116], relb: [100, 128], lelb: [108, 72], lhand: [140, 70], lhip: [162, 90], rhip: [162, 110], rknee: [214, 112], rank: [266, 112], rtoe: [276, 112], lstub: [198, 88] },
      scene: function () {
        return '<rect x="6" y="44" width="308" height="112" rx="12" fill="' + C.bedTop + '"/>' +
          '<ellipse cx="40" cy="100" rx="22" ry="34" fill="' + C.pillow + '"/>';
      }
    },
    sit: {
      vb: '0 -30 320 230', front: 'r',
      base: { head: [100, 48], neck: [100, 64], pel: [104, 126], lsh: [100, 72], rsh: [100, 72], relb: [104, 100], lelb: [94, 100], lhand: [112, 126], lhip: [106, 126], rhip: [106, 126], rknee: [158, 126], rank: [156, 182], rtoe: [174, 188], lstub: [140, 126] },
      stand: { head: [150, -2], neck: [150, 14], pel: [152, 76], lsh: [150, 22], rsh: [150, 22], relb: [153, 50], lelb: [170, 48], lhand: [200, 66], lhip: [152, 76], rhip: [152, 76], rknee: [156, 130], rank: [158, 182], rtoe: [176, 188], lstub: [156, 108] },
      scene: function () {
        return '<rect x="0" y="190" width="320" height="10" fill="' + C.floor + '"/>' +
          '<rect x="0" y="134" width="150" height="56" rx="6" fill="' + C.bedTop + '"/>';
      }
    }
  };

  function pts(J, names) { return names.map(function (n) { return J[n][0] + ',' + J[n][1]; }).join(' '); }
  function line(J, names, w, col) {
    return '<polyline points="' + pts(J, names) + '" fill="none" stroke="' + col + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"/>';
  }

  function figurePose(view, J, active, pulse) {
    var isActive = function (p) { return active.indexOf(p) >= 0; };
    var colFor = function (part, back) {
      if (isActive(part)) return C.active;
      return back ? C.back : C.body;
    };
    var cls = function (part) { return pulse && isActive(part) ? ' class="pulse"' : ''; };
    var parts = {
      larm: function (b) { return '<g' + cls('larm') + '>' + line(J, ['lsh', 'lelb', 'lhand'], 12, colFor('larm', b)) + '</g>'; },
      rstub: function (b) { return '<g' + cls('rstub') + '>' + line(J, ['rsh', 'relb'], 14, colFor('rstub', b)) + '</g>'; },
      rleg: function (b) {
        var c = colFor('rleg', b);
        return '<g' + cls('rleg') + '>' + line(J, ['rhip', 'rknee', 'rank'], 16, c) + line(J, ['rank', 'rtoe'], 10, c) + '</g>';
      },
      lstub: function (b) { return '<g' + cls('lstub') + '>' + line(J, ['lhip', 'lstub'], 17, colFor('lstub', b)) + '</g>'; }
    };
    var backParts = view.front === 'r' ? ['larm', 'lstub'] : view.front === 'l' ? ['rstub', 'rleg'] : [];
    var frontParts = ['larm', 'rstub', 'rleg', 'lstub'].filter(function (p) { return backParts.indexOf(p) < 0; });
    var s = '';
    backParts.forEach(function (p) { s += parts[p](true); });
    var tc = isActive('torso') ? C.active : C.body;
    s += '<g' + cls('torso') + '>' + line(J, ['neck', 'pel'], view.wide ? 40 : 30, tc) +
      '<circle cx="' + J.head[0] + '" cy="' + J.head[1] + '" r="15" fill="' + tc + '"/></g>';
    if (isActive('hip')) s += '<circle' + (pulse ? ' class="pulse"' : '') + ' cx="' + J.pel[0] + '" cy="' + J.pel[1] + '" r="17" fill="' + C.active + '" opacity="0.9"/>';
    frontParts.forEach(function (p) { s += parts[p](false); });
    return s;
  }

  function props(list, J, view) {
    var s = '';
    (list || []).forEach(function (p) {
      if (p === 'towelKnee') s += '<ellipse cx="' + J.rknee[0] + '" cy="' + (J.rknee[1] + 10) + '" rx="12" ry="5" fill="' + C.roll + '"/>';
      if (p === 'rollKnee') s += '<ellipse cx="' + J.rknee[0] + '" cy="' + (J.rknee[1] + 16) + '" rx="13" ry="11" fill="' + C.roll + '"/>';
      if (p === 'rollHeel') s += '<ellipse cx="' + J.rank[0] + '" cy="' + (J.rank[1] + 14) + '" rx="13" ry="10" fill="' + C.roll + '"/>';
      if (p === 'rollStub') s += '<ellipse cx="' + (J.lstub[0] - 6) + '" cy="' + (J.lstub[1] + 15) + '" rx="13" ry="10" fill="' + C.roll + '"/>';
      if (p === 'walker') s += '<g stroke="' + C.walker + '" stroke-width="5" stroke-linecap="round" fill="none"><path d="M198 66 L240 66 M204 66 L196 190 M236 66 L244 190"/></g>';
    });
    return s;
  }

  function resolve(view, spec) {
    if (spec === 'stand') return Object.assign({}, view.stand);
    return null;
  }

  function render(ex, opts) {
    opts = opts || {};
    var f = ex.fig || { view: 'supine' };
    var view = VIEWS[f.view] || VIEWS.supine;
    var A = resolve(view, f.a) || Object.assign({}, view.base, typeof f.a === 'object' ? f.a : {});
    var B = f.b ? (resolve(view, f.b) || Object.assign({}, A, f.b)) : null;
    var active = f.active || [];
    var dur = opts.dur || 3.2;
    var svg = '<svg class="fig' + (B ? ' anim' : '') + '" viewBox="' + view.vb + '" xmlns="http://www.w3.org/2000/svg" style="--dur:' + dur + 's" role="img" aria-label="' + ex.name + '">';
    svg += view.scene();
    if (B) {
      svg += '<g class="fA">' + props(f.props, A, view) + figurePose(view, A, active, false) + '</g>';
      svg += '<g class="fB">' + props(f.props, B, view) + figurePose(view, B, active, false) + '</g>';
    } else {
      svg += props(f.props, A, view) + figurePose(view, A, active, !!f.pulse);
    }
    svg += '</svg>';
    return svg;
  }

  root.FIGURES = { render: render, VIEWS: VIEWS };
})(typeof self !== 'undefined' ? self : this);
