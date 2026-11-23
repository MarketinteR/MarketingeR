/* Apu Torna – a tableten futó fő alkalmazás */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var CANCEL = { cancel: true };
  var S = function () { return Store.state.settings; };
  var P = function () { return Store.state.progress; };

  // ───────────── képernyők ─────────────
  var current = 'unlock';
  function show(id) {
    document.querySelectorAll('.screen').forEach(function (s) { s.classList.toggle('on', s.id === id); });
    current = id;
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-act]');
    if (a && a.dataset.act === 'home') { Voice.stop(); Voice.stopListening(); cancelRun(); goHome(); }
  });

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function rnd(a) { return a[Math.floor(Math.random() * a.length)]; }
  function nowMin() { var d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
  function toMin(t) { var p = String(t || '0:0').split(':'); return (+p[0]) * 60 + (+p[1] || 0); }
  function today() { return ENGINE.localDate(); }

  // ───────────── futás-vezérlés (megszakítható várakozás) ─────────────
  var run = { token: 0, paused: false };
  function cancelRun() { run.token++; run.paused = false; }
  function sleep(ms) {
    var my = run.token;
    return new Promise(function (res, rej) {
      var left = ms, last = Date.now();
      var iv = setInterval(function () {
        var n = Date.now(), dt = n - last; last = n;
        if (run.token !== my) { clearInterval(iv); return rej(CANCEL); }
        if (!run.paused) { left -= dt; if (left <= 0) { clearInterval(iv); res(); } }
      }, 80);
    });
  }
  function check(my) {
    if (run.token !== my) return Promise.reject(CANCEL);
    if (!run.paused) return Promise.resolve();
    return sleep(100).then(function () { return check(my); });
  }
  function say(key, text, extra) { var my = run.token; return Voice.say(key, text, extra).then(function () { return check(my); }); }

  // ───────────── hangbevitel kijelzés ─────────────
  function micUI(el, on, text) {
    el.classList.toggle('on', !!on);
    el.querySelector('.t').textContent = text || (on ? 'Figyelek… mondd ki!' : '');
  }
  function listenFor(micEl, parser, timeout) {
    if (!Voice.canListen()) { micUI(micEl, false, ''); return Promise.resolve(null); }
    return Voice.listen(timeout || 7000, function (on) { micUI(micEl, on); }).then(function (txt) {
      var v = parser(txt);
      micUI(micEl, false, txt ? (v ? '„' + txt.split(' | ')[0] + '”' : 'Nem értettem: „' + txt.split(' | ')[0] + '” – nyomd meg a gombot!') : 'Nyomd meg a gombot, vagy mondd ki!');
      return v;
    });
  }

  // ───────────── főképernyő ─────────────
  var DAYS = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat'];
  var MONTHS = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];

  function sessionsToday() { var d = today(); return P().sessions.filter(function (s) { return s.date === d && s.items.some(function (i) { return i.done; }); }); }
  function doneSlots() { var m = {}; sessionsToday().forEach(function (s) { if (s.slot) m[s.slot] = true; }); return m; }
  function currentSlot() {
    var times = (S().times || []).slice().sort(), done = doneSlots(), n = nowMin();
    var pending = times.filter(function (t) { return !done[t]; });
    if (!pending.length) return null;
    var due = pending.filter(function (t) { return toMin(t) <= n + 60; });
    return due.length ? due[due.length - 1] : pending[0];
  }

  function tickClock() {
    var d = new Date();
    $('clock').textContent = (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
    $('date').textContent = d.getFullYear() + '. ' + MONTHS[d.getMonth()] + ' ' + d.getDate() + '., ' + DAYS[d.getDay()];
  }

  var kidIdx = 0;
  var DEFAULT_KID_MSGS = ['Hajrá, {papa}! Szurkolunk neked!', 'Ha felállsz, együtt megyünk ki a kertbe!', '{papa}, te vagy a legerősebb!', 'Alig várjuk, hogy megölelhessünk állva!'];
  function renderKid() {
    var kids = S().grandkids || [], el = $('kidCard');
    if (!kids.length) {
      el.innerHTML = '<div class="ph">👨‍👧‍👦</div><div class="msg"><b>Az unokáid</b> szurkolnak neked!<br>Minden tornával közelebb kerülsz hozzájuk.</div>';
      return;
    }
    var k = kids[kidIdx % kids.length]; kidIdx++;
    var msg = k.message || rnd(DEFAULT_KID_MSGS);
    el.innerHTML = '<div class="ph" style="' + (k.photo ? 'background-image:url(' + k.photo + ')' : '') + '">' + (k.photo ? '' : esc((k.name || '?')[0])) + '</div>' +
      '<div class="msg"><b>' + esc(k.name) + ':</b> ' + esc(PHRASES.fill(msg, S())) + '</div>';
  }

  function renderHome() {
    tickClock();
    var h = new Date().getHours(), name = S().name || 'Apu';
    var done = sessionsToday().length, times = (S().times || []).slice().sort(), ds = doneSlots(), cur = currentSlot();
    var hello = h < 10 ? 'Jó reggelt, ' + name + '!' : h < 18 ? 'Szia, ' + name + '!' : 'Jó estét, ' + name + '!';
    if (times.length && Object.keys(ds).length >= times.length) hello += ' Mára minden tornát megcsináltál! 🏆';
    else if (done === 0) hello += ' Ma még nem tornáztunk.';
    else hello += ' Már ' + done + ' tornán túl vagy ma!';
    $('hello').textContent = hello;
    $('slots').innerHTML = times.map(function (t) {
      return '<div class="slot ' + (ds[t] ? 'done' : t === cur ? 'now' : '') + '">' + (ds[t] ? '✔' : '⏰') + ' ' + esc(t) + '</div>';
    }).join('');
    $('stStreak').textContent = ENGINE.streak(P());
    $('stStars').textContent = P().stars;
    $('stLevel').textContent = P().level;
    $('startBtn').textContent = cur ? '💪 Tornázzunk!' : '💪 Extra torna';
    $('goalText').textContent = S().goal || '';
    $('mountain').innerHTML = MOUNTAIN.render({ level: P().level, frac: ENGINE.levelProgress(P(), S()), levels: EXERCISES.LEVELS, kids: S().grandkids || [] });
    renderKid();
    var q = 0; try { q = JSON.parse(localStorage.getItem('apuTorna.queue') || '[]').length; } catch (e) { }
    $('netDot').textContent = Store.mode === 'server' ? (Store.online ? '● kapcsolat rendben' : '○ nincs kapcsolat' + (q ? ' – ' + q + ' torna feltöltésre vár' : '')) : '○ helyi mód';
  }

  function goHome() {
    show('home');
    renderHome();
  }

  // ───────────── emlékeztető ─────────────
  var remindState = (function () { try { return JSON.parse(localStorage.getItem('apuTorna.remind') || '{}'); } catch (e) { return {}; } })();
  function saveRemind() { try { localStorage.setItem('apuTorna.remind', JSON.stringify(remindState)); } catch (e) { } }
  function inQuiet() {
    var n = nowMin(), a = toMin(S().quietFrom || '21:00'), b = toMin(S().quietTo || '08:00');
    return a > b ? (n >= a || n < b) : (n >= a && n < b);
  }
  function dueSlot() {
    var times = (S().times || []).slice().sort(), ds = doneSlots(), n = nowMin();
    for (var i = times.length - 1; i >= 0; i--) {
      var t = toMin(times[i]), next = i + 1 < times.length ? toMin(times[i + 1]) : t + 180;
      if (n >= t && n < Math.min(next, t + 180)) return ds[times[i]] ? null : times[i];
    }
    return null;
  }
  function checkRemind() {
    if (current !== 'home' || inQuiet()) return;
    var slot = dueSlot(); if (!slot) return;
    var key = today() + ' ' + slot, r = remindState[key] || { count: 0, last: 0, snooze: 0 };
    var now = Date.now();
    if (r.count >= (S().remindMax || 6) || now < r.snooze) return;
    if (r.last && now - r.last < (S().remindEvery || 15) * 60000) return;
    r.count++; r.last = now; remindState[key] = r;
    Object.keys(remindState).forEach(function (k) { if (k.slice(0, 10) !== today()) delete remindState[k]; });
    saveRemind();
    showRemind(r.count, key);
  }
  function showRemind(n, key) {
    var kids = S().grandkids || [], k = kids.length ? rnd(kids) : null, name = S().name || 'Apu';
    $('remindPh').style.backgroundImage = k && k.photo ? 'url(' + k.photo + ')' : '';
    $('remindPh').textContent = k && k.photo ? '' : '💪';
    $('remindTitle').textContent = name + ', itt az idő tornázni!';
    $('remindSub').textContent = k ? k.name + ' szurkol neked! 💛' : 'Az unokák szurkolnak neked! 💛';
    $('remindLater').onclick = function () { Voice.stop(); remindState[key].snooze = Date.now() + 15 * 60000; saveRemind(); goHome(); };
    show('remind');
    var phrase = 'remind.' + Math.min(4, n);
    Voice.say(phrase).then(function () {
      if (k && Store.audioUrl('kid.' + k.id + '.cheer') && current === 'remind') return Voice.say('kid.' + k.id + '.cheer', k.name + ' üzeni: Hajrá ' + (S().kidsCall || 'Papa') + '!');
    });
  }
  $('remindGo').onclick = function () { Voice.stop(); startFlow(); };

  // ───────────── edzés folyamat ─────────────
  var sess = null;

  function startFlow() {
    Voice.stop(); cancelRun();
    var name = S().name || 'Apu';
    $('feelTitle').textContent = 'Hogy érzed magad, ' + name + '?';
    var fc = $('feelChoices');
    fc.innerHTML = Object.keys(ENGINE.FEELS).map(function (k) {
      var f = ENGINE.FEELS[k];
      return '<button class="choice' + (k === 'pain' ? ' pain' : '') + '" data-feel="' + k + '"><span class="em">' + f.emoji + '</span><span><b>' + f.label + '</b></span></button>';
    }).join('');
    show('feel');
    var chosen = false;
    var pick = function (feel) {
      if (chosen) return; chosen = true;
      Voice.stopListening(); Voice.stop();
      fc.querySelectorAll('.choice').forEach(function (b) { b.classList.toggle('sel', b.dataset.feel === feel); });
      beginSession(feel);
    };
    fc.onclick = function (e) { var b = e.target.closest('[data-feel]'); if (b) pick(b.dataset.feel); };
    var my = run.token;
    Voice.say('feel.ask').then(function () {
      if (chosen || run.token !== my || current !== 'feel') return;
      return listenFor($('feelMic'), Voice.parseFeel, 8000).then(function (v) { if (v && current === 'feel') pick(v); });
    });
  }

  function beginSession(feel) {
    var items = ENGINE.buildSession(JSON.parse(JSON.stringify(P())), S(), feel);
    sess = { id: uid(), feel: feel, slot: currentSlot(), items: items, idx: 0, results: [], startedAt: Date.now() };
    var my = run.token;
    Voice.say('feel.' + feel).then(function () {
      if (run.token !== my) return;
      showExercise();
    });
  }

  function exOf(it) { return EXERCISES.byId[it.id]; }

  function renderDots() {
    $('exDots').innerHTML = sess.items.map(function (_, i) { return '<i class="' + (i < sess.idx ? 'done' : i === sess.idx ? 'cur' : '') + '"></i>'; }).join('');
    $('exCount').textContent = (sess.idx + 1) + '. gyakorlat / ' + sess.items.length;
  }

  var autoTimer = null;
  function clearAuto() { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } $('autoNote').textContent = ''; }

  function showExercise() {
    cancelRun(); clearAuto();
    var it = sess.items[sess.idx], ex = exOf(it);
    var tempo = (ex.tempo || 3) * (S().tempoFactor || 1);
    $('figure').innerHTML = FIGURES.render(ex, { dur: Math.max(2.4, Math.min(6, tempo)) });
    $('exName').textContent = ex.name;
    $('exWhy').textContent = '💡 ' + ex.why;
    $('exDose').textContent = ENGINE.doseText(ex, it);
    $('exSteps').innerHTML = ex.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('');
    $('exCaution').textContent = ex.caution ? '⚠️ ' + ex.caution : '';
    $('exCaution').classList.toggle('hide', !ex.caution);
    $('helperBadge').classList.toggle('hide', !ex.helper);
    $('figWrap').classList.remove('running');
    $('btnsIdle').classList.remove('hide'); $('btnsRun').classList.add('hide');
    renderDots();
    show('exercise');
    introduce();
  }

  function introduce() {
    var my = run.token, isLast = sess.idx === sess.items.length - 1;
    var list = [];
    if (isLast && sess.items.length > 1) list.push(['lastex']);
    else if (sess.idx > 0) list.push(['next']);
    list.push(['ex.' + sess.items[sess.idx].id]);
    Voice.sayAll(list).then(function () {
      if (run.token !== my || current !== 'exercise') return;
      var secs = +S().autoStart || 0;
      if (!secs) return;
      var left = secs;
      $('autoNote').textContent = 'Magától indul ' + left + ' mp múlva…';
      autoTimer = setInterval(function () {
        left--;
        if (left <= 0) { clearAuto(); Voice.stopListening(); startExercise(); }
        else $('autoNote').textContent = 'Magától indul ' + left + ' mp múlva…';
      }, 1000);
      // közben hangparancsot is figyelünk
      if (Voice.canListen()) Voice.listen(Math.max(2000, (secs - 1) * 1000)).then(function (txt) {
        if (run.token !== my || current !== 'exercise' || !autoTimer) return;
        var c = Voice.parseCommand(txt);
        if (c === 'go') { clearAuto(); startExercise(); }
        else if (c === 'skip') { clearAuto(); skipExercise(); }
        else if (c === 'pause' || c === 'stop') { clearAuto(); $('autoNote').textContent = 'Várok. Nyomd meg a Mehet gombot, ha jöhet.'; }
      });
    }).catch(function () { });
  }

  $('goBtn').onclick = function () { clearAuto(); Voice.stop(); Voice.stopListening(); startExercise(); };
  $('repeatBtn').onclick = function () { clearAuto(); Voice.stop(); Voice.stopListening(); cancelRun(); introduce(); };
  $('skipBtn').onclick = function () { clearAuto(); Voice.stop(); Voice.stopListening(); skipExercise(); };
  $('pauseBtn').onclick = function () {
    run.paused = !run.paused;
    $('pauseBtn').textContent = run.paused ? '▶ Folytatás' : '❚❚ Szünet';
    if (run.paused) { Voice.stop(); Voice.say('paused'); $('cPhase').textContent = 'Szünet'; }
  };
  $('doneBtn').onclick = function () { Voice.stop(); cancelRun(); finishExercise(true); };

  function skipExercise() {
    cancelRun();
    var it = sess.items[sess.idx];
    sess.results.push({ id: it.id, done: false, reps: it.reps, hold: it.hold, time: it.time });
    nextExercise();
  }

  var ARC = 326.7;
  function ring(frac, color) {
    var a = $('ringArc');
    a.style.strokeDashoffset = String(ARC * (1 - Math.max(0, Math.min(1, frac))));
    if (color) a.style.stroke = color;
  }
  function setC(num, sub, phase, cls) {
    $('cNum').textContent = num; $('cSub').textContent = sub || '';
    var ph = $('cPhase'); ph.textContent = phase || ''; ph.className = 'phase ' + (cls || '');
  }

  function startExercise() {
    cancelRun();
    var my = run.token, it = sess.items[sess.idx], ex = exOf(it);
    var tf = S().tempoFactor || 1;
    $('figWrap').classList.add('running');
    $('btnsIdle').classList.add('hide'); $('btnsRun').classList.remove('hide');
    $('pauseBtn').textContent = '❚❚ Szünet';
    var p;
    if (ex.type === 'reps') p = runReps(my, it.reps, (ex.tempo || 3) * tf * 1000);
    else if (ex.type === 'hold') p = runHold(my, it.reps, it.hold);
    else if (ex.type === 'timer') p = runTimer(my, it.time);
    else p = runBreath(my, it.reps, tf);
    p.then(function () { if (run.token === my) finishExercise(true); }).catch(function (e) { if (e !== CANCEL) console.error(e); });
  }

  function runReps(my, reps, tempoMs) {
    var i = 0;
    setC(0, '/ ' + reps, 'Rajta!', ''); ring(0, '#ff9f1c');
    function step() {
      if (i >= reps) return Promise.resolve();
      i++;
      var t0 = Date.now();
      setC(i, '/ ' + reps, i === reps ? 'Utolsó!' : '', ''); ring(i / reps);
      return Voice.count(i).then(function () { return check(my); }).then(function () {
        if (reps >= 6 && i === Math.floor(reps / 2)) return say('half');
        if (reps >= 6 && i === reps - 2) return say('last2');
      }).then(function () { return sleep(Math.max(300, tempoMs - (Date.now() - t0))); }).then(step);
    }
    return say('start').then(step);
  }

  function runHold(my, reps, hold) {
    var r = 0;
    function rep() {
      if (r >= reps) return Promise.resolve();
      r++;
      setC(hold, r + '. / ' + reps + ' ismétlés', 'Feszíts!', 'hold'); ring(0, '#ff9f1c');
      return say(r === reps && reps > 1 ? 'last1' : 'hold.start').then(function () {
        var s = 0;
        function sec() {
          if (s >= hold) return Promise.resolve();
          s++;
          var t0 = Date.now();
          setC(hold - s + 1, r + '. / ' + reps + ' ismétlés', 'Tartsd!', 'hold'); ring(s / hold);
          return Voice.count(s).then(function () { return check(my); }).then(function () { return sleep(Math.max(150, 1000 - (Date.now() - t0))); }).then(sec);
        }
        return sec();
      }).then(function () {
        setC('😌', r + '. / ' + reps + ' ismétlés', 'Engedd el, pihenj', 'relax'); ring(1, '#3ecf8e');
        return say('hold.end');
      }).then(function () { return sleep(r < reps ? 3000 : 500); }).then(rep);
    }
    return rep();
  }

  function runTimer(my, total) {
    var left = total, halfSaid = false, endSaid = false;
    setC(ENGINE.fmtTime(left), '', 'Lazíts…', 'relax'); ring(0, '#3ecf8e');
    function tick() {
      if (left <= 0) return Promise.resolve();
      return sleep(1000).then(function () {
        left--;
        var m = Math.floor(left / 60), s = left % 60;
        setC(m + ':' + (s < 10 ? '0' : '') + s, 'hátralévő idő', 'Lazíts, lélegezz nyugodtan', 'relax');
        ring(1 - left / total);
        if (!halfSaid && total >= 60 && left <= total / 2) { halfSaid = true; Voice.say('timer.half'); }
        if (!endSaid && total >= 30 && left === 10) { endSaid = true; Voice.say('timer.end10'); }
        return tick();
      });
    }
    return say('start').then(tick);
  }

  function runBreath(my, reps, tf) {
    var i = 0;
    function br() {
      if (i >= reps) return Promise.resolve();
      i++;
      setC(i, '/ ' + reps, 'Szívd be…', ''); ring(0, '#4ea8ff');
      var anim = function (ms, from, to) {
        var t0 = Date.now();
        return new Promise(function (res, rej) {
          var my2 = run.token;
          var iv = setInterval(function () {
            if (run.token !== my2) { clearInterval(iv); return rej(CANCEL); }
            var f = Math.min(1, (Date.now() - t0) / ms); ring(from + (to - from) * f);
            if (f >= 1) { clearInterval(iv); res(); }
          }, 100);
        });
      };
      return Voice.say('breath.in').then(function () { return check(my); }).then(function () { return anim(3500 * tf, 0, 1); })
        .then(function () { setC(i, '/ ' + reps, 'Fújd ki…', 'relax'); return Voice.say('breath.out'); })
        .then(function () { return check(my); }).then(function () { return anim(4500 * tf, 1, 0); }).then(br);
    }
    return br();
  }

  function finishExercise(done) {
    cancelRun();
    var it = sess.items[sess.idx], ex = exOf(it);
    sess.pendingResult = { id: it.id, done: done, reps: it.reps, hold: it.hold, time: it.time };
    $('figWrap').classList.remove('running');
    askFeedback(ex);
  }

  function askFeedback(ex) {
    $('fbSub').textContent = ex.name + ' – mondd ki, vagy nyomd meg!';
    var fc = $('fbChoices');
    fc.innerHTML = Object.keys(ENGINE.FEEDBACK).map(function (k) {
      var f = ENGINE.FEEDBACK[k];
      return '<button class="choice' + (k === 'pain' ? ' pain' : '') + '" data-fb="' + k + '"><span class="em">' + f.emoji + '</span><span><b>' + f.label + '</b><small>' + f.sub + '</small></span></button>';
    }).join('');
    micUI($('fbMic'), false, '');
    show('feedback');
    var chosen = false, my = run.token;
    var pick = function (fb) {
      if (chosen) return; chosen = true;
      Voice.stopListening(); Voice.stop();
      fc.querySelectorAll('.choice').forEach(function (b) { b.classList.toggle('sel', b.dataset.fb === fb); });
      sess.pendingResult.fb = fb;
      sess.results.push(sess.pendingResult);
      Voice.say('fb.' + fb).then(function () {
        if (fb === 'pain') return askPain();
        nextExercise();
      });
    };
    fc.onclick = function (e) { var b = e.target.closest('[data-fb]'); if (b) pick(b.dataset.fb); };
    Voice.say('ex.done').then(function () { return chosen ? null : Voice.say('fb.ask'); }).then(function () {
      if (chosen || run.token !== my || current !== 'feedback') return;
      return listenFor($('fbMic'), Voice.parseFeedback, 8000).then(function (v) {
        if (v && current === 'feedback') return pick(v);
        // még egyszer megpróbáljuk
        if (!chosen && current === 'feedback') return sleep(1500).then(function () {
          if (chosen || current !== 'feedback') return;
          return listenFor($('fbMic'), Voice.parseFeedback, 8000).then(function (v2) { if (v2 && current === 'feedback') pick(v2); });
        });
      });
    }).catch(function () { });
  }

  function askPain() {
    show('painAsk');
    var chosen = false;
    var go = function (cont) {
      if (chosen) return; chosen = true; Voice.stopListening(); Voice.stop();
      if (cont) nextExercise(); else finishSession(true);
    };
    $('painGo').onclick = function () { go(true); };
    $('painStop').onclick = function () { go(false); };
    listenFor($('painMic'), Voice.parseCommand, 8000).then(function (c) {
      if (chosen || current !== 'painAsk') return;
      if (c === 'stop' || c === 'pause') go(false); else if (c === 'go') go(true);
    });
  }

  function nextExercise() {
    sess.idx++;
    if (sess.idx >= sess.items.length) return finishSession(false);
    showExercise();
  }

  function finishSession(stoppedEarly) {
    cancelRun();
    var result = {
      id: sess.id, date: today(), at: new Date().toISOString(), slot: sess.slot, feel: sess.feel,
      dur: Math.round((Date.now() - sess.startedAt) / 1000), items: sess.results
    };
    // a ki nem próbált gyakorlatok kihagyottként
    sess.items.slice(sess.results.length).forEach(function (it) { result.items.push({ id: it.id, done: false }); });
    var starsBefore = P().stars, pendBefore = P().pending.length;
    Store.submitSession(result).then(function () {
      var won = P().stars - starsBefore;
      showDone(won, stoppedEarly, P().pending.slice());
    });
  }

  function confetti() {
    var em = ['⭐', '🎉', '💪', '🏆', '🌟'];
    for (var i = 0; i < 18; i++) (function (i) {
      var c = document.createElement('div');
      c.className = 'confetti'; c.textContent = rnd(em);
      c.style.left = Math.random() * 100 + 'vw';
      c.style.animationDuration = (2.5 + Math.random() * 2.5) + 's';
      c.style.animationDelay = (Math.random() * 1.2) + 's';
      document.body.appendChild(c);
      setTimeout(function () { c.remove(); }, 6500);
    })(i);
  }

  function showDone(won, stoppedEarly, pending) {
    var name = S().name || 'Apu';
    $('doneTitle').textContent = stoppedEarly ? 'Pihenj, ' + name + '!' : 'Ügyes voltál, ' + name + '! 🎉';
    $('starsWon').textContent = won > 0 ? '+' + won + ' ⭐' : '';
    var st = ENGINE.streak(P());
    var info = st > 1 ? '🔥 ' + st + ' napja tornázol egymás után!' : '';
    var lp = Math.round(ENGINE.levelProgress(P(), S()) * 100);
    if (P().level < EXERCISES.LEVELS.length) info += (info ? '  ·  ' : '') + '⛰️ ' + P().level + '. szint: ' + lp + '%';
    $('doneInfo').textContent = info;

    var lv = pending.filter(function (p) { return p.type === 'level'; }).pop();
    var rw = pending.filter(function (p) { return p.type === 'reward'; })[0];
    $('levelUp').classList.toggle('hide', !lv);
    if (lv) $('levelUp').textContent = '🏔️ Szintet léptél! ' + lv.level + '. szint: ' + EXERCISES.LEVELS[lv.level - 1].name;

    var reward = rw && (S().rewards || [])[rw.index];
    var rEl = $('reward');
    if (reward) {
      var kid = (S().grandkids || []).filter(function (k) { return k.id === reward.from; })[0];
      var photo = reward.photo || (kid && kid.photo);
      rEl.innerHTML = '<div class="ph" style="' + (photo ? 'background-image:url(' + photo + ')' : '') + '">' + (photo ? '' : '💌') + '</div>' +
        '<div><div class="from">💌 ' + esc(kid ? kid.name + ' üzenete' : 'Üzenet az unokáktól') + '</div><div class="txt">' + esc(PHRASES.fill(reward.text || '', S())) + '</div></div>';
    } else if (!stoppedEarly && (S().grandkids || []).length) {
      var k = rnd(S().grandkids);
      rEl.innerHTML = '<div class="ph" style="' + (k.photo ? 'background-image:url(' + k.photo + ')' : '') + '">' + (k.photo ? '' : '💛') + '</div>' +
        '<div><div class="from">' + esc(k.name) + '</div><div class="txt">' + esc(PHRASES.fill(k.message || rnd(DEFAULT_KID_MSGS), S())) + '</div></div>';
    } else rEl.innerHTML = '';
    rEl.classList.toggle('hide', !rEl.innerHTML);

    show('done');
    if (!stoppedEarly) confetti();
    var list = [[stoppedEarly ? 'done.stop' : 'done']];
    if (lv) list.push(['levelup']);
    if (reward) {
      list.push(['reward']);
      var kidName = ((S().grandkids || []).filter(function (k) { return k.id === reward.from; })[0] || {}).name;
      list.push(['reward.' + reward.id, (kidName ? kidName + ' üzeni: ' : '') + (reward.text || '')]);
    } else if (!stoppedEarly) list.push(['praise.' + (1 + Math.floor(Math.random() * 4))]);
    if (st >= 3 && !stoppedEarly) list.push(['streak']);
    Voice.sayAll(list);
    if (pending.length) Store.consumePending(pending.length);
    sess = null;
    // 3 perc után magától visszamegy a főképernyőre
    setTimeout(function () { if (current === 'done') goHome(); }, 180000);
  }

  // ───────────── indulás ─────────────
  $('startBtn').onclick = function () { startFlow(); };

  // fogaskerék: hosszan nyomva nyílik az admin (hogy véletlenül ne)
  (function () {
    var t = null, g = $('gear');
    var start = function () { t = setTimeout(function () { location.href = 'admin.html'; }, 1500); };
    var end = function () { clearTimeout(t); };
    g.addEventListener('touchstart', start); g.addEventListener('mousedown', start);
    g.addEventListener('touchend', end); g.addEventListener('mouseup', end); g.addEventListener('mouseleave', end);
  })();

  var wakeLock = null;
  function keepAwake() {
    try { if ('wakeLock' in navigator) navigator.wakeLock.request('screen').then(function (l) { wakeLock = l; }).catch(function () { }); } catch (e) { }
  }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') { keepAwake(); if (current === 'home') Store.load().then(renderHome); } });

  $('unlockBtn').onclick = function () {
    Voice.unlock();
    keepAwake();
    try { var de = document.documentElement; if (de.requestFullscreen) de.requestFullscreen().catch(function () { }); } catch (e) { }
    goHome();
    var h = new Date().getHours();
    setTimeout(function () { Voice.say(h < 10 ? 'greet.morning' : h < 18 ? 'greet.day' : 'greet.evening'); }, 400);
  };

  Store.load().then(function () {
    renderHome();
    if (new URLSearchParams(location.search).has('auto')) $('unlockBtn').onclick();
  });

  setInterval(function () { if (current === 'home') tickClock(); }, 10000);
  setInterval(function () { if (current === 'home') { checkRemind(); } }, 30000);
  setInterval(function () { if (current === 'home') renderKid(); }, 20000);
  // 5 percenként szinkron (admin változtatások, függő edzések feltöltése)
  setInterval(function () { if (current === 'home') Store.load().then(function () { if (current === 'home') renderHome(); }); }, 300000);

  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(function () { });
})();
