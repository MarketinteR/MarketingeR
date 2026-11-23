/*
 * Edzés-motor: edzésterv összeállítása, visszajelzés alapú fejlődés, szintlépés, csillagok.
 * Ugyanez a fájl fut a böngészőben és a szerveren (Node) is.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./exercises.js'));
  else root.ENGINE = factory(root.EXERCISES);
})(typeof self !== 'undefined' ? self : this, function (EX) {
  var FEEDBACK = {
    easy: { label: 'Túl kevés volt', sub: 'Bírtam volna többet', emoji: '💪', steps: 2 },
    good: { label: 'Jól ment', sub: 'Pont jó volt', emoji: '👍' },
    hard: { label: 'Nehéz volt', sub: 'De megcsináltam', emoji: '😤' },
    much: { label: 'Túl sok volt', sub: 'Kevesebb kéne', emoji: '🥵', steps: -2 },
    fail: { label: 'Nem sikerült', sub: 'Nem ment', emoji: '😕', steps: -2 },
    pain: { label: 'Fájt', sub: 'Fájdalmat éreztem', emoji: '⚠️', steps: -3 }
  };
  var FEELS = {
    great: { label: 'Remekül', emoji: '😄' },
    good: { label: 'Jól', emoji: '🙂' },
    tired: { label: 'Fáradtan', emoji: '😩' },
    pain: { label: 'Fáj valami', emoji: '🤕' }
  };

  function defaultSettings() {
    return {
      name: 'Apu',            // így szólítja a hang
      kidsCall: 'Papa',       // így hívják az unokák
      goal: 'Felállni, és megölelni az unokákat',
      grandkids: [],          // [{id, name, photo(dataURL), message}]
      rewards: [],            // unoka-üzenetek, sorban nyílnak: [{id, from, text, photo}]
      rewardEvery: 3,         // ennyi edzésenként nyílik egy új unoka-üzenet
      times: ['09:30', '13:00', '17:30'],
      remindEvery: 15,        // percenként ismétli az emlékeztetőt
      remindMax: 6,
      quietFrom: '21:00',
      quietTo: '08:00',
      perSession: 7,
      autoLevel: true,
      levelUpAfter: 10,       // ennyi jó edzés után jöhet a következő szint
      tempoFactor: 1,         // 1.3 = lassabb számolás
      voiceRate: 0.9,
      autoStart: 10           // ennyi mp után magától indul a gyakorlat (0 = soha)
    };
  }

  function defaultProgress() {
    return {
      level: 1, levelSessions: 0, stars: 0, ex: {}, sessions: [], days: {},
      rewardsUnlocked: 0, pending: [], flags: [], applied: [], createdAt: new Date().toISOString()
    };
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function localDate(d) { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function addDays(dateStr, n) {
    var p = dateStr.split('-'); var d = new Date(+p[0], +p[1] - 1, +p[2] + n);
    return localDate(d);
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function exState(progress, ex) {
    var st = progress.ex[ex.id];
    if (!st) {
      st = { good: 0, hard: 0, pain: 0, count: 0, skips: 0, paused: false, last: null, hist: [] };
      if (ex.dose.reps) st.reps = ex.dose.reps[0];
      if (ex.dose.hold) st.hold = ex.dose.hold[0];
      if (ex.dose.time) st.time = ex.dose.time[0];
      progress.ex[ex.id] = st;
    }
    return st;
  }

  // n lépéssel növel/csökkent. Mindig azt a paramétert mozdítja, ami arányosan kevésbé (ill. jobban) haladt.
  function bump(ex, st, n) {
    var fields = ['reps', 'hold', 'time'].filter(function (f) { return ex.dose[f]; });
    for (var i = 0; i < Math.abs(n); i++) {
      var best = null, bestFrac = null;
      fields.forEach(function (f) {
        var d = ex.dose[f], frac = (st[f] - d[1]) / Math.max(1, d[2] - d[1]);
        if (n > 0 && st[f] < d[2] && (bestFrac === null || frac < bestFrac)) { best = f; bestFrac = frac; }
        if (n < 0 && st[f] > d[1] && (bestFrac === null || frac > bestFrac)) { best = f; bestFrac = frac; }
      });
      if (!best) return;
      var d = ex.dose[best];
      st[best] = clamp(st[best] + (n > 0 ? d[3] : -d[3]), d[1], d[2]);
    }
  }

  function applyFeedback(ex, st, fb, date) {
    st.count++; st.last = date;
    st.hist.push(fb); if (st.hist.length > 10) st.hist.shift();
    var flag = null;
    if (fb === 'good') {
      st.good++; st.hard = 0; st.pain = 0;
      if (st.good >= 2) { bump(ex, st, 1); st.good = 0; }
    } else if (fb === 'easy') {
      bump(ex, st, 2); st.good = 0; st.hard = 0; st.pain = 0;
    } else if (fb === 'hard') {
      st.hard++; st.good = 0;
      if (st.hard >= 2) { bump(ex, st, -1); st.hard = 0; }
    } else if (fb === 'much') {
      bump(ex, st, -2); st.good = 0; st.hard = 0;
    } else if (fb === 'fail') {
      bump(ex, st, -2); st.good = 0;
      flag = 'Nem sikerült: ' + ex.name;
    } else if (fb === 'pain') {
      bump(ex, st, -3); st.good = 0; st.pain++;
      flag = 'FÁJDALOM: ' + ex.name;
      if (st.pain >= 2) { st.paused = true; flag += ' – szüneteltetve (2× egymás után fájt)'; }
    }
    return flag;
  }

  function streak(progress, today) {
    today = today || localDate();
    var d = progress.days[today] ? today : addDays(today, -1), n = 0;
    while (progress.days[d]) { n++; d = addDays(d, -1); }
    return n;
  }

  function unlocked(progress) {
    return EX.LIST.filter(function (e) {
      if (e.level > progress.level) return false;
      var st = progress.ex[e.id];
      return !(st && st.paused);
    });
  }

  /* Mai edzés összeállítása a hangulat (feel) alapján. */
  function buildSession(progress, settings, feel) {
    var pool = unlocked(progress), factor = 1, n = settings.perSession || 7;
    if (feel === 'pain') { pool = pool.filter(function (e) { return e.gentle; }); n = 4; factor = 0.6; }
    else if (feel === 'tired') { n = Math.max(4, n - 2); factor = 0.8; }
    else if (feel === 'great') { n = n + 1; }

    var first = pool.filter(function (e) { return e.first; });
    var lasts = pool.filter(function (e) { return e.last; });
    var core = pool.filter(function (e) { return e.core && !e.first && !e.last; });
    var rest = pool.filter(function (e) { return !e.core && !e.first && !e.last; });
    // ami régóta nem volt (vagy még soha), és az új szint gyakorlatai előre
    rest.sort(function (a, b) {
      var sa = progress.ex[a.id], sb = progress.ex[b.id];
      var la = sa && sa.last || '', lb = sb && sb.last || '';
      if (la !== lb) return la < lb ? -1 : 1;
      return b.level - a.level;
    });
    // magasabb szintű core előre, hogy ha kevés a hely, az új kihívás bekerüljön
    core.sort(function (a, b) { return b.level - a.level; });
    var lastPick = lasts.sort(function (a, b) { return b.level - a.level; }).slice(0, feel === 'great' ? 2 : 1);

    var picked = first.slice(0, 1);
    var room = n - picked.length - lastPick.length;
    core.concat(rest).forEach(function (e) { if (room > 0) { picked.push(e); room--; } });
    picked = picked.concat(lastPick);

    return picked.map(function (e) {
      var st = exState(progress, e), it = { id: e.id };
      ['reps', 'hold', 'time'].forEach(function (f) {
        if (e.dose[f]) {
          var v = st[f];
          if (factor !== 1) v = Math.round(v * factor / e.dose[f][3]) * e.dose[f][3];
          it[f] = clamp(v, e.dose[f][1], e.dose[f][2]);
        }
      });
      return it;
    });
  }

  /* Edzés eredményének feldolgozása. result: {id, date, at, slot, feel, dur, items:[{id, done, fb, reps, hold, time}]} */
  function applySession(progress, settings, result) {
    if (result.id && progress.applied.indexOf(result.id) >= 0) return progress; // már feldolgozva
    var date = result.date || localDate();
    var done = 0, flags = [], goodish = 0;
    (result.items || []).forEach(function (it) {
      var ex = EX.byId[it.id]; if (!ex) return;
      var st = exState(progress, ex);
      if (it.done) {
        done++;
        if (it.fb === 'good' || it.fb === 'easy') goodish++;
        var f = applyFeedback(ex, st, it.fb || 'good', date);
        if (f) flags.push(f);
      } else { st.skips++; }
    });
    var total = (result.items || []).length;
    var complete = total > 0 && done / total >= 0.8;
    var dayCountBefore = progress.days[date] || 0;
    var stars = done + (complete ? 3 : 0);
    if (complete && dayCountBefore + 1 === (settings.times || []).length) stars += 5; // napi összes edzés kész

    if (done > 0) progress.days[date] = dayCountBefore + 1;
    progress.stars += stars;
    var summary = {
      id: result.id, date: date, at: result.at || new Date().toISOString(), slot: result.slot || null,
      feel: result.feel, dur: result.dur || 0, stars: stars, level: progress.level,
      items: (result.items || []).map(function (it) { return { id: it.id, done: !!it.done, fb: it.fb || null, reps: it.reps, hold: it.hold, time: it.time }; })
    };
    progress.sessions.push(summary);
    if (progress.sessions.length > 400) progress.sessions.splice(0, progress.sessions.length - 400);
    if (result.id) { progress.applied.push(result.id); if (progress.applied.length > 60) progress.applied.shift(); }

    flags.forEach(function (t) { progress.flags.push({ date: date, text: t, at: summary.at }); });
    if (result.feel === 'pain') progress.flags.push({ date: date, text: 'Edzés előtt azt mondta: fáj valami', at: summary.at });
    if (progress.flags.length > 100) progress.flags.splice(0, progress.flags.length - 100);

    if (done > 0) {
      if (complete) progress.levelSessions++;
      // unoka-üzenet nyílik
      var totalSessions = progress.sessions.filter(function (s) { return s.items.some(function (i) { return i.done; }); }).length;
      var every = settings.rewardEvery || 3;
      var shouldHave = Math.floor(totalSessions / every);
      var available = (settings.rewards || []).length;
      if (shouldHave > progress.rewardsUnlocked && progress.rewardsUnlocked < available) {
        progress.rewardsUnlocked++;
        progress.pending.push({ type: 'reward', index: progress.rewardsUnlocked - 1 });
      }
      // szintlépés
      if (settings.autoLevel !== false && readyForLevelUp(progress, settings)) {
        progress.level++; progress.levelSessions = 0;
        progress.pending.push({ type: 'level', level: progress.level });
        unlocked(progress).forEach(function (e) { exState(progress, e); });
      }
    }
    return progress;
  }

  function readyForLevelUp(progress, settings) {
    if (progress.level >= EX.LEVELS.length) return false;
    if (progress.levelSessions < (settings.levelUpAfter || 10)) return false;
    var recent = progress.sessions.slice(-6), fbs = [];
    recent.forEach(function (s) { s.items.forEach(function (i) { if (i.done) fbs.push(i.fb); }); });
    if (!fbs.length) return false;
    var pain = fbs.filter(function (f) { return f === 'pain'; }).length;
    var good = fbs.filter(function (f) { return f === 'good' || f === 'easy'; }).length;
    var completion = recent.filter(function (s) {
      var d = s.items.filter(function (i) { return i.done; }).length; return d / Math.max(1, s.items.length) >= 0.8;
    }).length / recent.length;
    return pain === 0 && good / fbs.length >= 0.6 && completion >= 0.8;
  }

  function levelProgress(progress, settings) {
    if (progress.level >= EX.LEVELS.length) return 1;
    return clamp(progress.levelSessions / (settings.levelUpAfter || 10), 0, 1);
  }

  /* Admin módosítás: {level, ex:{id:{reps,hold,time,paused}}, clearFlags, clearPending} */
  function applyAdmin(progress, patch) {
    if (patch.level) { progress.level = clamp(+patch.level, 1, EX.LEVELS.length); progress.levelSessions = 0; unlocked(progress).forEach(function (e) { exState(progress, e); }); }
    if (patch.ex) Object.keys(patch.ex).forEach(function (id) {
      var ex = EX.byId[id]; if (!ex) return;
      var st = exState(progress, ex), p = patch.ex[id];
      ['reps', 'hold', 'time'].forEach(function (f) { if (p[f] != null && ex.dose[f]) st[f] = clamp(+p[f], ex.dose[f][1], ex.dose[f][2]); });
      if (p.paused != null) { st.paused = !!p.paused; if (!st.paused) st.pain = 0; }
    });
    if (patch.clearFlags) progress.flags = [];
    if (patch.clearPending) progress.pending = [];
    if (patch.consumePending) progress.pending = progress.pending.slice(patch.consumePending);
    return progress;
  }

  function doseText(ex, it) {
    if (ex.type === 'timer') return fmtTime(it.time);
    if (ex.type === 'hold') return it.reps + ' × ' + it.hold + ' mp';
    if (ex.type === 'breath') return it.reps + ' légzés';
    return it.reps + ' ismétlés';
  }
  function fmtTime(s) {
    s = Math.max(0, Math.round(s));
    var m = Math.floor(s / 60), r = s % 60;
    return m ? m + ':' + pad(r) + ' perc' : r + ' mp';
  }

  return {
    FEEDBACK: FEEDBACK, FEELS: FEELS, defaultSettings: defaultSettings, defaultProgress: defaultProgress,
    localDate: localDate, addDays: addDays, exState: exState, bump: bump, applyFeedback: applyFeedback,
    streak: streak, unlocked: unlocked, buildSession: buildSession, applySession: applySession,
    readyForLevelUp: readyForLevelUp, levelProgress: levelProgress, applyAdmin: applyAdmin,
    doseText: doseText, fmtTime: fmtTime
  };
});
