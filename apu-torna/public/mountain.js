/* A „hegymászás”: minden szint egy tábor, a csúcson az unokák várnak. */
(function (root) {
  var PATH = [[60, 330], [150, 300], [110, 262], [215, 236], [170, 196], [285, 170], [240, 132], [345, 110], [315, 80], [430, 58]];
  var CAMPS = [0, 2, 4, 6, 8]; // melyik töréspontnál van az 1..5. szint tábora; a csúcs az utolsó pont

  function segLens() {
    var L = [0];
    for (var i = 1; i < PATH.length; i++) L.push(L[i - 1] + Math.hypot(PATH[i][0] - PATH[i - 1][0], PATH[i][1] - PATH[i - 1][1]));
    return L;
  }
  function pointAtIndexFrac(idxA, idxB, f) {
    var L = segLens(), target = L[idxA] + (L[idxB] - L[idxA]) * f;
    for (var i = 1; i < PATH.length; i++) {
      if (L[i] >= target) {
        var t = (target - L[i - 1]) / Math.max(1, L[i] - L[i - 1]);
        return [PATH[i - 1][0] + (PATH[i][0] - PATH[i - 1][0]) * t, PATH[i - 1][1] + (PATH[i][1] - PATH[i - 1][1]) * t];
      }
    }
    return PATH[PATH.length - 1];
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function render(opts) {
    var level = opts.level, frac = opts.frac, levels = opts.levels, kids = opts.kids || [];
    var a = CAMPS[level - 1], b = level < CAMPS.length ? CAMPS[level] : PATH.length - 1;
    if (level >= levels.length) { a = CAMPS[levels.length - 1]; b = PATH.length - 1; }
    var me = pointAtIndexFrac(a, b, frac);
    var L = segLens(), doneLen = L[a] + (L[b] - L[a]) * frac;

    var s = '<svg viewBox="0 -170 600 530" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">';
    s += '<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1424"/><stop offset="1" stop-color="#1e3a5f"/></linearGradient>' +
      '<linearGradient id="mt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a5a86"/><stop offset="1" stop-color="#1a2b47"/></linearGradient>';
    kids.slice(0, 3).forEach(function (k, i) { s += '<clipPath id="kc' + i + '"><circle cx="0" cy="0" r="22"/></clipPath>'; });
    s += '</defs>';
    s += '<rect y="-170" width="600" height="530" fill="url(#sky)"/>';
    // csillagok
    [[40, -130], [120, -60], [520, -120], [560, -20], [480, -150], [260, -100], [80, 20], [580, 60], [330, -40], [200, -140]].forEach(function (p) { s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.6" fill="#cfe0ff" opacity=".7"/>'; });
    s += '<circle cx="110" cy="-90" r="30" fill="#ffd166" opacity=".9"/>';
    // hegyek
    s += '<polygon points="-20,360 140,170 260,260 380,120 460,200 620,90 620,360" fill="#162740"/>';
    s += '<polygon points="0,360 120,250 250,150 330,190 430,40 520,150 600,120 600,360" fill="url(#mt)"/>';
    s += '<polygon points="430,40 400,82 418,78 432,92 446,76 462,84" fill="#e8f0ff" opacity=".85"/>';
    s += '<polygon points="0,360 0,320 90,300 200,330 320,310 460,335 600,300 600,360" fill="#0f1d33"/>';
    // út
    var pts = PATH.map(function (p) { return p.join(','); }).join(' ');
    s += '<polyline points="' + pts + '" fill="none" stroke="#0d1726" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" opacity=".6"/>';
    s += '<polyline points="' + pts + '" fill="none" stroke="#9fb3cf" stroke-width="4" stroke-dasharray="2 10" stroke-linecap="round" stroke-linejoin="round"/>';
    s += '<polyline points="' + pts + '" fill="none" stroke="#ff9f1c" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="' + doneLen + ' 4000"/>';
    // táborok
    CAMPS.forEach(function (ci, i) {
      var p = PATH[ci], reached = level > i || (level === i + 1);
      s += '<g transform="translate(' + p[0] + ',' + p[1] + ')">' +
        '<polygon points="-12,6 0,-14 12,6" fill="' + (reached ? '#3ecf8e' : '#3a4d6e') + '" stroke="#0d1726" stroke-width="2"/>' +
        '<text x="18" y="5" font-size="16" font-weight="700" fill="' + (reached ? '#e6fff3' : '#9fb3cf') + '">' + (i + 1) + '. ' + esc(levels[i].short) + '</text></g>';
    });
    // csúcs: zászló + unokák
    var top = PATH[PATH.length - 1];
    s += '<g transform="translate(' + top[0] + ',' + top[1] + ')"><line x1="0" y1="0" x2="0" y2="-40" stroke="#e8f0ff" stroke-width="3"/><polygon points="0,-40 28,-32 0,-24" fill="#ff5d5d"/></g>';
    kids.slice(0, 3).forEach(function (k, i) {
      var x = top[0] + 50 + i * 50, y = top[1] - 8;
      s += '<g transform="translate(' + x + ',' + y + ')"><circle r="25" fill="#ffd166"/>';
      if (k.photo) s += '<image href="' + k.photo + '" x="-22" y="-22" width="44" height="44" preserveAspectRatio="xMidYMid slice" clip-path="url(#kc' + i + ')"/>';
      else s += '<circle r="22" fill="#213659"/><text y="8" font-size="22" font-weight="800" text-anchor="middle" fill="#ffd166">' + esc((k.name || '?')[0]) + '</text>';
      s += '</g>';
    });
    if (!kids.length) s += '<text x="' + (top[0] + 40) + '" y="' + (top[1] + 2) + '" font-size="34">👨‍👧‍👦</text>';
    // Apu jelölője
    s += '<g transform="translate(' + me[0] + ',' + me[1] + ')"><circle r="20" fill="#ff9f1c" stroke="#fff" stroke-width="4"/><text y="8" font-size="22" text-anchor="middle">💪</text></g>';
    s += '</svg>';
    return s;
  }

  root.MOUNTAIN = { render: render };
})(typeof self !== 'undefined' ? self : this);
