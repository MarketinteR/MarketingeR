/*
 * Hang: a te felvételeid lejátszása (ha van), különben magyar gépi hang (TTS).
 * Hangbevitel: magyar beszédfelismerés (Chrome / Android), kulcsszó-alapú értelmezéssel.
 */
(function (root) {
  var audio = null, token = 0, huVoice = null;

  function pickVoice() {
    if (!('speechSynthesis' in window)) return;
    var vs = speechSynthesis.getVoices() || [];
    huVoice = vs.filter(function (v) { return /^hu/i.test(v.lang); })[0] || null;
  }
  if ('speechSynthesis' in window) {
    pickVoice();
    speechSynthesis.onvoiceschanged = pickVoice;
  }

  function settings() { return (Store.state && Store.state.settings) || {}; }

  function tts(text, myToken) {
    return new Promise(function (resolve) {
      if (!('speechSynthesis' in window)) return setTimeout(resolve, 300 + text.length * 50);
      var done = false, finish = function () { if (!done) { done = true; clearTimeout(guard); resolve(); } };
      var u = new SpeechSynthesisUtterance(text);
      u.lang = 'hu-HU'; if (huVoice) u.voice = huVoice;
      u.rate = settings().voiceRate || 0.9;
      u.onend = finish; u.onerror = finish;
      // egyes Androidokon az onend néha elmarad – biztonsági időzítő
      var guard = setTimeout(finish, 2500 + text.length * 110 / (u.rate || 1));
      speechSynthesis.speak(u);
    });
  }

  function play(url) {
    return new Promise(function (resolve) {
      if (!audio) audio = new Audio();
      var done = false, finish = function () { if (!done) { done = true; clearTimeout(guard); resolve(true); } };
      var guard = setTimeout(finish, 60000);
      audio.onended = finish;
      audio.onerror = function () { done = true; clearTimeout(guard); resolve(false); };
      audio.src = url;
      var p = audio.play();
      if (p && p.catch) p.catch(function () { done = true; clearTimeout(guard); resolve(false); });
    });
  }

  var Voice = {
    muted: false,

    /* key: mondat-kulcs (phrases.js), text: felülírt szöveg (opcionális) */
    say: function (key, text, extra) {
      var my = token;
      if (Voice.muted) return Promise.resolve();
      var url = key && Store.audioUrl(key);
      var phrase = PHRASES.byKey[key];
      var t = PHRASES.fill(text || (phrase && phrase.text) || '', settings(), extra);
      if (url) {
        Voice._stopMedia();
        return play(url).then(function (ok) {
          if (!ok && my === token && t) return tts(t, my);
        });
      }
      return t ? tts(t, my) : Promise.resolve();
    },

    /* több mondat egymás után; megszakad, ha közben stop() jön */
    sayAll: function (list) {
      var my = token, p = Promise.resolve();
      list.forEach(function (item) {
        p = p.then(function () { if (token !== my) return; return Voice.say(item[0], item[1], item[2]); });
      });
      return p;
    },

    count: function (n) { return Voice.say('num.' + n); },

    _stopMedia: function () {
      try { if ('speechSynthesis' in window && speechSynthesis.speaking) speechSynthesis.cancel(); } catch (e) { }
    },
    stop: function () {
      token++;
      try { if (audio) { audio.pause(); audio.removeAttribute('src'); } } catch (e) { }
      try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch (e) { }
    },

    /* hang „feloldása” (az első érintéskor kell meghívni a böngésző szabályai miatt) */
    unlock: function () {
      try { if (!audio) audio = new Audio(); audio.muted = true; var p = audio.play(); if (p && p.catch) p.catch(function () { }); audio.muted = false; } catch (e) { }
      try { if ('speechSynthesis' in window) { var u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } } catch (e) { }
    },

    canListen: function () { return !!(window.SpeechRecognition || window.webkitSpeechRecognition); },

    /* egyszeri meghallgatás: visszaadja a felismert szöveg(ek)et, vagy null-t */
    listen: function (timeoutMs, onState) {
      return new Promise(function (resolve) {
        var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return resolve(null);
        var rec, done = false, texts = [];
        var finish = function (v) {
          if (done) return; done = true; clearTimeout(t);
          try { rec.abort(); } catch (e) { }
          Voice._rec = null;
          if (onState) onState(false);
          resolve(v);
        };
        try {
          rec = new SR();
          rec.lang = 'hu-HU'; rec.interimResults = false; rec.maxAlternatives = 4; rec.continuous = false;
          rec.onresult = function (ev) {
            for (var i = 0; i < ev.results.length; i++) for (var j = 0; j < ev.results[i].length; j++) texts.push(ev.results[i][j].transcript);
            finish(texts.join(' | '));
          };
          rec.onerror = function () { finish(null); };
          rec.onend = function () { finish(texts.length ? texts.join(' | ') : null); };
          Voice._rec = rec;
          rec.start();
          if (onState) onState(true);
        } catch (e) { return finish(null); }
        var t = setTimeout(function () { finish(texts.length ? texts.join(' | ') : null); }, timeoutMs || 7000);
      });
    },
    stopListening: function () { try { if (Voice._rec) Voice._rec.abort(); } catch (e) { } },

    norm: function (s) {
      return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    },

    /* „Hogy ment?” – kulcsszavak alapján */
    parseFeedback: function (text) {
      var s = Voice.norm(text); if (!s) return null;
      if (/faj|fajdalom|szur|hasogat/.test(s)) return 'pain';
      if (/nem sikerult|nem ment|nem tudtam|nem jott|nem birtam|nem megy/.test(s)) return 'fail';
      if (/keves|konnyu|tobbet|tobb is|meg birtam|meg tudnek|semmiseg|gyerekjatek/.test(s)) return 'easy';
      if (/tul sok|sok volt|eleg volt|kimerult|kifarasztott|nagyon nehez|hosszu/.test(s)) return 'much';
      if (/nehez|kemeny|faraszto|izzaszto|alig/.test(s)) return 'hard';
      if (/jo|jol|sikerult|rendben|oke|ok\b|szuper|remek|megvan|ment|kesz|igen/.test(s)) return 'good';
      return null;
    },
    /* „Hogy érzed magad?” */
    parseFeel: function (text) {
      var s = Voice.norm(text); if (!s) return null;
      if (/faj|beteg|rosszul vagyok|szedul/.test(s)) return 'pain';
      if (/farad|almos|gyenge|rossz|nem vagyok jol|nincs kedv|kimerult|nem tul jol/.test(s)) return 'tired';
      if (/remek|szuper|kivalo|nagyon jo|nagyon jol|eros|fantasztikus|kituno|csodas/.test(s)) return 'great';
      if (/jo|jol|rendben|megvagyok|elvagyok|oke|ok\b|egesz jo|nem rossz/.test(s)) return 'good';
      return null;
    },
    /* parancsok */
    parseCommand: function (text) {
      var s = Voice.norm(text); if (!s) return null;
      if (/eleg|befejez|vege|abbahagy|nem folytat|majd kesobb/.test(s)) return 'stop';
      if (/kihagy|kovetkezo|tovabb|ugorj/.test(s)) return 'skip';
      if (/szunet|allj|varj|stop/.test(s)) return 'pause';
      if (/mehet|kezd|indul|gyerunk|start|folytat|igen|rajta|csinaljuk/.test(s)) return 'go';
      return null;
    }
  };

  root.Voice = Voice;
})(typeof self !== 'undefined' ? self : this);
