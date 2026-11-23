/* Apu Torna – admin (neked): áttekintés, gyakorlatok, unokák, hangfelvételek, beállítások */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var S = function () { return Store.state.settings; };
  var P = function () { return Store.state.progress; };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function toast(t, bad) { var el = $('toast'); el.textContent = t; el.style.background = bad ? '#ff6b6b' : ''; el.style.display = 'block'; clearTimeout(toast._t); toast._t = setTimeout(function () { el.style.display = 'none'; }, 2200); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  var FB = ENGINE.FEEDBACK, FEELS = ENGINE.FEELS;

  var tab = 'ov';
  $('nav').onclick = function (e) {
    var b = e.target.closest('[data-tab]'); if (!b) return;
    tab = b.dataset.tab;
    document.querySelectorAll('#nav button').forEach(function (x) { x.classList.toggle('on', x === b); });
    document.querySelectorAll('main section').forEach(function (s) { s.classList.toggle('on', s.id === tab); });
    render();
  };

  function render() {
    $('mode').textContent = Store.mode === 'server' ? (Store.online ? '● szerver: kapcsolódva' : '○ szerver nem elérhető') : '○ helyi mód (nincs szerver)';
    ({ ov: renderOv, ex: renderEx, kids: renderKids, voice: renderVoice, set: renderSet, data: renderData })[tab]();
  }

  // ───────────── ÁTTEKINTÉS ─────────────
  function renderOv() {
    var p = P(), s = S(), lv = EXERCISES.LEVELS[p.level - 1];
    var last14 = [], d = ENGINE.localDate();
    for (var i = 13; i >= 0; i--) { var dd = ENGINE.addDays(d, -i); last14.push({ d: dd, n: p.days[dd] || 0 }); }
    var max = Math.max(s.times.length || 3, 1);
    var sessions = p.sessions.slice().reverse().slice(0, 25);
    var h = '';
    if (p.flags.length) {
      h += '<div class="card"><h2>⚠️ Figyelmeztetések</h2>' + p.flags.slice().reverse().slice(0, 15).map(function (f) { return '<div class="flag">' + esc(f.date) + ' – ' + esc(f.text) + '</div>'; }).join('') +
        '<button class="btn" id="clrFlags">Láttam, törlöm</button></div>';
    }
    h += '<div class="card"><div class="grid">' +
      kpi(p.level + '. szint', lv.name) + kpi(Math.round(ENGINE.levelProgress(p, s) * 100) + '%', 'a következő szintig (' + p.levelSessions + '/' + s.levelUpAfter + ' jó edzés)') +
      kpi('🔥 ' + ENGINE.streak(p), 'nap egymás után') + kpi('⭐ ' + p.stars, 'csillag összesen') +
      kpi(p.sessions.length, 'edzés összesen') + kpi(p.rewardsUnlocked + '/' + (s.rewards || []).length, 'unoka-üzenet kinyitva') +
      '</div></div>';
    h += '<div class="card"><h2>Utolsó 14 nap (edzés/nap)</h2><div class="bars">' +
      last14.map(function (x) { return '<div class="' + (x.n ? '' : 'zero') + '" title="' + x.d + ': ' + x.n + '" style="height:' + Math.max(2, Math.min(100, x.n / max * 100)) + '%"></div>'; }).join('') +
      '</div><div class="barLbl">' + last14.map(function (x) { return '<span>' + x.d.slice(8) + '</span>'; }).join('') + '</div></div>';
    h += '<div class="card"><h2>Legutóbbi edzések</h2>' + (sessions.length ? '<table><tr><th>Mikor</th><th>Hangulat</th><th>Gyakorlatok és visszajelzés</th><th>⭐</th></tr>' +
      sessions.map(function (x) {
        var t = new Date(x.at);
        return '<tr><td>' + esc(x.date.slice(5)) + ' ' + t.toTimeString().slice(0, 5) + '<br><span class="muted">' + Math.round((x.dur || 0) / 60) + ' perc</span></td><td>' + (FEELS[x.feel] ? FEELS[x.feel].emoji + ' ' + FEELS[x.feel].label : '') + '</td><td>' +
          x.items.map(function (i) { var e = EXERCISES.byId[i.id]; return '<span title="' + esc(e ? e.name : i.id) + (i.fb ? ': ' + FB[i.fb].label : ': kihagyva') + '">' + (i.done ? (FB[i.fb] || FB.good).emoji : '⏭️') + '</span>'; }).join(' ') +
          '</td><td>' + x.stars + '</td></tr>';
      }).join('') + '</table>' : '<p class="muted">Még nincs edzés.</p>') + '</div>';
    $('ov').innerHTML = h;
    if ($('clrFlags')) $('clrFlags').onclick = function () { Store.adminProgress({ clearFlags: true }).then(render); };
  }
  function kpi(b, t) { return '<div class="kpi"><b>' + esc(b) + '</b><span>' + esc(t) + '</span></div>'; }

  // ───────────── GYAKORLATOK ─────────────
  function renderEx() {
    var p = P();
    var h = '<div class="card"><h2>Szint</h2><div class="row"><select id="lvSel">' + EXERCISES.LEVELS.map(function (l) {
      return '<option value="' + l.n + '"' + (l.n === p.level ? ' selected' : '') + '>' + l.n + '. ' + esc(l.name) + ' – ' + esc(l.goal) + '</option>';
    }).join('') + '</select><button class="btn pri" id="lvSave">Szint beállítása</button></div>' +
      '<p class="muted">A szint magától is lép, ha az utolsó edzések jól mentek és nem fájt semmi (Beállítások → automatikus szintlépés). A 4–5. szint gyakorlatai CSAK kísérővel végezhetők!</p></div>';
    EXERCISES.LEVELS.forEach(function (l) {
      var exs = EXERCISES.LIST.filter(function (e) { return e.level === l.n; });
      h += '<div class="card"><h2>' + l.n + '. ' + esc(l.name) + (l.n > p.level ? ' <span class="pill">még zárva</span>' : '') + '</h2><table><tr><th>Gyakorlat</th><th>Ábra</th><th>Adag</th><th>Utolsó visszajelzések</th><th>Szünetel</th></tr>';
      exs.forEach(function (e) {
        var st = p.ex[e.id] || {}, dose = '';
        ['reps', 'hold', 'time'].forEach(function (f) {
          if (!e.dose[f]) return;
          var lbl = { reps: e.type === 'breath' ? 'légzés' : 'ism.', hold: 'mp tartás', time: 'mp' }[f];
          var v = st[f] != null ? st[f] : e.dose[f][0];
          dose += '<label class="row" style="gap:4px;margin:2px 0"><input type="number" data-ex="' + e.id + '" data-f="' + f + '" min="' + e.dose[f][1] + '" max="' + e.dose[f][2] + '" step="' + e.dose[f][3] + '" value="' + v + '"> ' + lbl + '</label>';
        });
        h += '<tr><td><b>' + esc(e.name) + '</b>' + (e.core ? ' <span class="pill">alap</span>' : '') + (e.helper ? ' <span class="pill" style="background:#4a1f1f">kísérővel</span>' : '') +
          '<br><span class="muted">' + esc(e.why) + '</span></td><td style="width:140px">' + FIGURES.render(e).replace('<svg ', '<svg style="width:130px;height:auto" ') + '</td><td>' + dose + '</td><td>' +
          (st.hist || []).map(function (f) { return '<span title="' + FB[f].label + '">' + FB[f].emoji + '</span>'; }).join(' ') + (st.count ? '<br><span class="muted">' + st.count + '× csinálta</span>' : '') +
          '</td><td><input type="checkbox" data-pause="' + e.id + '"' + (st.paused ? ' checked' : '') + '></td></tr>';
      });
      h += '</table></div>';
    });
    h += '<div class="row"><button class="btn pri" id="exSave">💾 Adagok mentése</button></div>';
    $('ex').innerHTML = h;
    $('lvSave').onclick = function () {
      if (!confirm('Biztosan átállítod a szintet?')) return;
      Store.adminProgress({ level: +$('lvSel').value }).then(function () { toast('Szint mentve'); render(); });
    };
    $('exSave').onclick = function () {
      var patch = { ex: {} };
      document.querySelectorAll('#ex input[data-ex]').forEach(function (i) { (patch.ex[i.dataset.ex] = patch.ex[i.dataset.ex] || {})[i.dataset.f] = +i.value; });
      document.querySelectorAll('#ex input[data-pause]').forEach(function (i) { (patch.ex[i.dataset.pause] = patch.ex[i.dataset.pause] || {}).paused = i.checked; });
      Store.adminProgress(patch).then(function () { toast('Mentve'); render(); }).catch(function () { toast('Hiba a mentésnél', true); });
    };
  }

  // ───────────── UNOKÁK ÉS ÜZENETEK ─────────────
  function resizeImage(file, max) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () {
        var img = new Image();
        img.onload = function () {
          var sc = Math.min(1, max / Math.max(img.width, img.height));
          var c = document.createElement('canvas'); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', 0.82));
        };
        img.onerror = reject; img.src = r.result;
      };
      r.onerror = reject; r.readAsDataURL(file);
    });
  }

  function recorderUI(key, label, fallbackText) {
    var has = !!Store.state.audio[key];
    return '<div class="row" data-rec="' + esc(key) + '" data-fallback="' + esc(fallbackText || '') + '">' +
      '<span class="pill ' + (has ? 'rec' : '') + '">' + (has ? '✔ felvéve' : 'nincs felvétel') + '</span>' +
      '<button class="btn rec" data-act="rec">🎙 ' + esc(label || 'Felvétel') + '</button>' +
      '<button class="btn" data-act="play">▶</button>' +
      (has ? '<button class="btn red" data-act="del">🗑</button>' : '') +
      '<label class="btn" title="Hangfájl feltöltése">📁<input type="file" accept="audio/*" data-act="file" hidden></label></div>';
  }

  function saveSettings(s, msg) {
    return Store.saveSettings(s).then(function () { toast(msg || 'Mentve'); render(); }).catch(function (e) { toast('Hiba: ' + e.message, true); });
  }

  function renderKids() {
    var s = S(), kids = s.grandkids || [], rewards = s.rewards || [];
    var h = '<div class="card"><h2>👨‍👧‍👦 Unokák</h2><p class="muted">Fotó, név és egy rövid üzenet – ezek jelennek meg a főképernyőn, a hegy csúcsán és az emlékeztetőkön. Vedd fel az unoka hangján a „Hajrá Papa!” szurkolást is – az emlékeztetőnél ez szól.</p>';
    kids.forEach(function (k, i) {
      h += '<div class="kid" data-kid="' + i + '"><div class="ph" style="' + (k.photo ? 'background-image:url(' + k.photo + ')' : '') + '">' + (k.photo ? '' : esc((k.name || '?')[0])) + '</div><div class="body">' +
        '<div class="row"><input data-k="name" value="' + esc(k.name) + '" placeholder="Név"><label class="btn">📷 Fotó<input type="file" accept="image/*" data-k="photo" hidden></label><button class="btn red" data-k="del">Törlés</button></div>' +
        '<input data-k="message" value="' + esc(k.message || '') + '" placeholder="Üzenet, pl.: Hajrá {papa}! Ha felállsz, együtt focizunk!">' +
        '<div class="muted" style="font-size:13px">Szurkolás az unoka hangján:</div>' + recorderUI('kid.' + k.id + '.cheer', 'Unoka hangja', k.name + ' üzeni: Hajrá ' + (s.kidsCall || 'Papa') + '!') +
        '</div></div>';
    });
    h += '<div class="row"><button class="btn" id="addKid">＋ Unoka hozzáadása</button><button class="btn pri" id="saveKids">💾 Mentés</button></div></div>';

    h += '<div class="card"><h2>💌 Unoka-üzenetek (jutalmak)</h2><p class="muted">Minden ' + (s.rewardEvery || 3) + '. edzés után kinyílik a következő üzenet – fotóval és az unoka hangjával. Érdemes előre feltölteni párat, és néha újakat hozzáadni (pl. „Papa, ha legközelebb jövünk, megmutatod, hogy ülsz az ágy szélén?”).</p>';
    rewards.forEach(function (r, i) {
      var opened = i < P().rewardsUnlocked;
      h += '<div class="kid" data-rw="' + i + '"><div class="ph" style="' + (r.photo ? 'background-image:url(' + r.photo + ')' : '') + '">' + (r.photo ? '' : '💌') + '</div><div class="body">' +
        '<div class="row"><b>' + (i + 1) + '.</b> <select data-r="from"><option value="">(az unokáktól)</option>' + kids.map(function (k) { return '<option value="' + k.id + '"' + (k.id === r.from ? ' selected' : '') + '>' + esc(k.name) + '</option>'; }).join('') + '</select>' +
        (opened ? '<span class="pill rec">kinyitva</span>' : '<span class="pill">vár</span>') +
        '<label class="btn">📷 Fotó<input type="file" accept="image/*" data-r="photo" hidden></label><button class="btn red" data-r="del">Törlés</button></div>' +
        '<textarea data-r="text" placeholder="Üzenet szövege">' + esc(r.text || '') + '</textarea>' +
        recorderUI('reward.' + r.id, 'Hangüzenet', r.text) + '</div></div>';
    });
    h += '<div class="row"><button class="btn" id="addRw">＋ Új üzenet</button><button class="btn pri" id="saveRw">💾 Mentés</button></div></div>';
    $('kids').innerHTML = h;

    function collect() {
      var st = clone(S());
      document.querySelectorAll('[data-kid]').forEach(function (el) {
        var k = st.grandkids[+el.dataset.kid];
        k.name = el.querySelector('[data-k=name]').value.trim();
        k.message = el.querySelector('[data-k=message]').value.trim();
      });
      document.querySelectorAll('[data-rw]').forEach(function (el) {
        var r = st.rewards[+el.dataset.rw];
        r.from = el.querySelector('[data-r=from]').value;
        r.text = el.querySelector('[data-r=text]').value.trim();
      });
      return st;
    }
    $('addKid').onclick = function () { var st = collect(); st.grandkids.push({ id: uid(), name: '', message: '' }); saveSettings(st, 'Hozzáadva'); };
    $('addRw').onclick = function () { var st = collect(); st.rewards.push({ id: uid(), from: '', text: '' }); saveSettings(st, 'Hozzáadva'); };
    $('saveKids').onclick = $('saveRw').onclick = function () { saveSettings(collect()); };
    $('kids').onchange = function (e) {
      var t = e.target;
      if (t.type === 'file' && (t.dataset.k === 'photo' || t.dataset.r === 'photo') && t.files[0]) {
        resizeImage(t.files[0], 520).then(function (url) {
          var st = collect();
          var kEl = t.closest('[data-kid]'), rEl = t.closest('[data-rw]');
          if (kEl) st.grandkids[+kEl.dataset.kid].photo = url;
          if (rEl) st.rewards[+rEl.dataset.rw].photo = url;
          saveSettings(st, 'Fotó mentve');
        });
      }
    };
    $('kids').onclick = function (e) {
      var t = e.target;
      if (t.dataset.k === 'del') { if (!confirm('Törlöd?')) return; var st = collect(); st.grandkids.splice(+t.closest('[data-kid]').dataset.kid, 1); saveSettings(st, 'Törölve'); }
      if (t.dataset.r === 'del') { if (!confirm('Törlöd?')) return; var st2 = collect(); st2.rewards.splice(+t.closest('[data-rw]').dataset.rw, 1); saveSettings(st2, 'Törölve'); }
    };
  }

  // ───────────── HANGFELVÉTELEK ─────────────
  var recState = null; // {key, rec, chunks, btn}

  function renderVoice() {
    var h = '';
    if (Store.mode !== 'server') h += '<div class="warn">A hangfelvételekhez a szerver kell (node server.js). Helyi módban a tablet gépi hangja beszél.</div>';
    if (!window.isSecureContext) h += '<div class="warn">A böngésző csak HTTPS-en (vagy localhoston) engedi a mikrofont. Tailscale-en: <code>tailscale serve --bg 8080</code>, és nyisd meg a https://…ts.net címet. Addig is tölts fel kész hangfájlokat a 📁 gombbal.</div>';
    var total = PHRASES.LIST.length, done = PHRASES.LIST.filter(function (p) { return Store.state.audio[p.key]; }).length;
    h += '<div class="card"><h2>🎙 A te hangod</h2><p class="muted">Olvasd fel a szövegeket a saját szavaiddal – nyugodtan fogalmazd át, ahogy Apuval beszélni szoktál. Ahol nincs felvétel, a gépi hang olvassa fel a szöveget. ' +
      '<b>' + done + ' / ' + total + '</b> mondat felvéve. Tipp: a „Gyakorlatok leírása” és a „Visszajelzés” csoport hallatszik a legtöbbet – azokkal kezdd.</p></div>';
    var groups = {};
    PHRASES.LIST.forEach(function (p) { (groups[p.group] = groups[p.group] || []).push(p); });
    Object.keys(groups).forEach(function (g, gi) {
      var list = groups[g], n = list.filter(function (p) { return Store.state.audio[p.key]; }).length;
      h += '<div class="card"><details' + (gi < 2 ? ' open' : '') + '><summary>' + esc(g) + ' <span class="pill' + (n === list.length ? ' rec' : '') + '">' + n + '/' + list.length + '</span></summary>';
      list.forEach(function (p) {
        h += '<div class="phr"><div><div class="t">' + esc(PHRASES.fill(p.text, S(), { unoka: '(unoka neve)' })) + '</div><div class="k">' + esc(p.key) + '</div></div>' + recorderUI(p.key, 'Felvétel', p.text) + '</div>';
      });
      h += '</details></div>';
    });
    $('voice').innerHTML = h;
  }

  // felvétel / lejátszás / törlés / feltöltés – közös kezelő minden fülön
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (!b) return;
    var box = b.closest('[data-rec]'); if (!box) return;
    var key = box.dataset.rec, act = b.dataset.act;
    if (act === 'play') { Voice.stop(); Voice.say(key, box.dataset.fallback || (PHRASES.byKey[key] && PHRASES.byKey[key].text) || ''); }
    if (act === 'del') { if (confirm('Törlöd ezt a felvételt?')) Store.deleteAudio(key).then(function () { toast('Törölve'); render(); }); }
    if (act === 'rec') toggleRec(key, b);
  });
  document.addEventListener('change', function (e) {
    var t = e.target; if (t.dataset.act !== 'file' || !t.files[0]) return;
    var key = t.closest('[data-rec]').dataset.rec;
    Store.uploadAudio(key, t.files[0]).then(function () { toast('Feltöltve'); render(); }).catch(function (er) { toast('Hiba: ' + er.message, true); });
  });

  function toggleRec(key, btn) {
    if (recState) {
      var was = recState.key; recState.rec.stop();
      if (was === key) return;
    }
    if (!navigator.mediaDevices || !window.MediaRecorder) { toast('Ez a böngésző nem tud felvenni (HTTPS kell)', true); return; }
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }).then(function (stream) {
      var mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].filter(function (m) { return MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m); })[0];
      var rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined), chunks = [];
      rec.ondataavailable = function (ev) { if (ev.data.size) chunks.push(ev.data); };
      rec.onstop = function () {
        stream.getTracks().forEach(function (t) { t.stop(); });
        btn.classList.remove('on'); btn.textContent = '🎙 Felvétel';
        recState = null;
        var blob = new Blob(chunks, { type: (rec.mimeType || 'audio/webm').split(';')[0] });
        if (blob.size < 1500) { toast('Túl rövid felvétel', true); return; }
        Store.uploadAudio(key, blob).then(function () { toast('Felvétel mentve ✔'); render(); }).catch(function (er) { toast('Hiba: ' + er.message, true); });
      };
      rec.start();
      recState = { key: key, rec: rec };
      btn.classList.add('on'); btn.textContent = '⏹ Stop';
    }).catch(function () { toast('Nincs mikrofon-engedély', true); });
  }

  // ───────────── BEÁLLÍTÁSOK ─────────────
  function renderSet() {
    var s = S();
    var f = function (key, label, type, extra) {
      var v = s[key];
      if (type === 'check') return '<label class="row"><input type="checkbox" data-s="' + key + '"' + (v ? ' checked' : '') + '> ' + label + '</label>';
      return '<label class="f">' + label + '<input data-s="' + key + '" type="' + (type || 'text') + '" value="' + esc(Array.isArray(v) ? v.join(', ') : v) + '" ' + (extra || '') + '></label>';
    };
    $('set').innerHTML = '<div class="card"><h2>Alapok</h2><div class="grid">' +
      f('name', 'Így szólítja a hang') + f('kidsCall', 'Így hívják az unokák') + '</div><br>' + f('goal', 'A nagy cél (a hegy csúcsán)') + '</div>' +
      '<div class="card"><h2>Napirend és emlékeztető</h2><div class="grid">' +
      f('times', 'Torna-időpontok (vesszővel)') + f('remindEvery', 'Emlékeztető ismétlése (perc)', 'number', 'min=5 max=120') + f('remindMax', 'Max. emlékeztető / alkalom', 'number', 'min=1 max=20') +
      f('quietFrom', 'Csendes idő kezdete', 'time') + f('quietTo', 'Csendes idő vége', 'time') + '</div></div>' +
      '<div class="card"><h2>Edzés</h2><div class="grid">' +
      f('perSession', 'Gyakorlatok száma / edzés', 'number', 'min=3 max=14') + f('levelUpAfter', 'Jó edzés a szintlépéshez', 'number', 'min=3 max=60') +
      f('rewardEvery', 'Unoka-üzenet minden … edzés után', 'number', 'min=1 max=20') + f('tempoFactor', 'Tempó (1 = normál, 1.5 = lassabb)', 'number', 'min=0.6 max=2.5 step=0.1') +
      f('voiceRate', 'Gépi hang sebessége', 'number', 'min=0.5 max=1.5 step=0.05') + f('autoStart', 'Magától indul … mp után (0 = soha)', 'number', 'min=0 max=60') +
      '</div><br>' + f('autoLevel', 'Automatikus szintlépés', 'check') + '</div>' +
      '<div class="row"><button class="btn pri" id="setSave">💾 Mentés</button><button class="btn" id="ttsTest">🔊 Gépi hang próba</button></div>';
    $('setSave').onclick = function () {
      var st = clone(S());
      document.querySelectorAll('#set [data-s]').forEach(function (i) {
        var k = i.dataset.s;
        if (i.type === 'checkbox') st[k] = i.checked;
        else if (k === 'times') st[k] = i.value.split(/[,;\s]+/).filter(function (t) { return /^\d{1,2}:\d{2}$/.test(t); }).map(function (t) { return t.length === 4 ? '0' + t : t; }).sort();
        else if (i.type === 'number') st[k] = +i.value;
        else st[k] = i.value;
      });
      saveSettings(st);
    };
    $('ttsTest').onclick = function () { Voice.stop(); Voice.say(null, 'Szia ' + (S().name || 'Apu') + '! Így szól a gépi hang. Kezdjük a tornát?'); };
  }

  // ───────────── ADATOK ─────────────
  function renderData() {
    $('data').innerHTML = '<div class="card"><h2>Mentés és visszaállítás</h2><p class="muted">A szerver naponta automatikus biztonsági mentést készít a data/backup mappába (30 napig).</p>' +
      '<div class="row"><button class="btn pri" id="exp">⬇ Exportálás (JSON)</button><label class="btn">⬆ Importálás<input type="file" accept="application/json" id="imp" hidden></label></div></div>' +
      '<div class="card"><h2>Újrakezdés</h2><p class="muted">Törli a haladást (szint, csillagok, napló). A beállítások, unokák és hangfelvételek megmaradnak.</p><button class="btn red" id="reset">Haladás nullázása</button></div>';
    $('exp').onclick = function () {
      var data = { settings: S(), progress: P(), exportedAt: new Date().toISOString() };
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }));
      a.download = 'apu-torna-' + ENGINE.localDate() + '.json'; a.click();
    };
    $('imp').onchange = function (e) {
      var f = e.target.files[0]; if (!f) return;
      f.text().then(function (t) {
        var d = JSON.parse(t);
        if (!confirm('Felülírod a mostani adatokat az importált fájllal?')) return;
        return Store.replaceAll({ settings: d.settings, progress: d.progress, audio: Store.state.audio }).then(function () { toast('Importálva'); render(); });
      }).catch(function () { toast('Hibás fájl', true); });
    };
    $('reset').onclick = function () {
      if (!confirm('Biztosan nullázod Apu haladását?')) return;
      Store.replaceAll({ settings: S(), progress: ENGINE.defaultProgress(), audio: Store.state.audio }).then(function () { toast('Nullázva'); render(); });
    };
  }

  Store.load().then(render);
})();
