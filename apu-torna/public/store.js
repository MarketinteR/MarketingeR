/*
 * Adattár: ha fut a szerver (Tailscale-en), ott tárol; ha nem elérhető, a tablet helyi tárolójába ment,
 * és amint újra van kapcsolat, feltölti a függő edzéseket.
 */
(function (root) {
  var LS_STATE = 'apuTorna.state', LS_QUEUE = 'apuTorna.queue';

  function lsGet(k, def) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* tele / tiltva */ } }

  function api(method, path, body, raw) {
    var opts = { method: method, headers: {}, cache: 'no-store' };
    if (body !== undefined) {
      if (raw) { opts.body = body; opts.headers['Content-Type'] = body.type || 'application/octet-stream'; }
      else { opts.body = JSON.stringify(body); opts.headers['Content-Type'] = 'application/json'; }
    }
    return fetch(path, opts).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  var Store = {
    mode: 'local', // 'server' | 'local'
    online: false,
    state: null,
    listeners: [],

    onChange: function (fn) { this.listeners.push(fn); },
    _set: function (st) {
      // hiányzó mezők pótlása új verzióknál
      var ds = ENGINE.defaultSettings(), dp = ENGINE.defaultProgress();
      st.settings = Object.assign(ds, st.settings || {});
      st.progress = Object.assign(dp, st.progress || {});
      st.audio = st.audio || {};
      this.state = st;
      lsSet(LS_STATE, st);
      this.listeners.forEach(function (fn) { try { fn(st); } catch (e) { console.error(e); } });
      return st;
    },

    load: function () {
      var self = this;
      return api('GET', 'api/state').then(function (st) {
        self.mode = 'server'; self.online = true;
        self._set(st);
        return self.flush().then(function () { return self.state; });
      }).catch(function () {
        var cached = lsGet(LS_STATE, null);
        // ha korábban szerverről jött, továbbra is szerver-módban maradunk (offline)
        self.mode = cached && cached._server ? 'server' : 'local';
        self.online = false;
        return self._set(cached || { settings: ENGINE.defaultSettings(), progress: ENGINE.defaultProgress(), audio: {} });
      });
    },

    // függő (offline) edzések feltöltése
    flush: function () {
      var self = this, q = lsGet(LS_QUEUE, []);
      if (!q.length || self.mode !== 'server') return Promise.resolve();
      var next = q[0];
      return api('POST', 'api/session', next).then(function (st) {
        lsSet(LS_QUEUE, lsGet(LS_QUEUE, []).slice(1));
        self._set(st);
        return self.flush();
      }).catch(function () { self.online = false; });
    },

    submitSession: function (result) {
      var self = this;
      // helyben azonnal alkalmazzuk (a képernyő ebből dolgozik)
      var local = JSON.parse(JSON.stringify(self.state));
      ENGINE.applySession(local.progress, local.settings, result);
      if (self.mode !== 'server') return Promise.resolve(self._set(local));
      return api('POST', 'api/session', result).then(function (st) {
        self.online = true; return self._set(st);
      }).catch(function () {
        var q = lsGet(LS_QUEUE, []); q.push(result); lsSet(LS_QUEUE, q);
        self.online = false;
        local._server = true;
        return self._set(local);
      });
    },

    consumePending: function (n) {
      var self = this, local = JSON.parse(JSON.stringify(self.state));
      ENGINE.applyAdmin(local.progress, { consumePending: n });
      if (self.mode !== 'server') return Promise.resolve(self._set(local));
      self._set(local);
      return api('POST', 'api/admin/progress', { consumePending: n }).then(function (st) { return self._set(st); }).catch(function () { return local; });
    },

    saveSettings: function (settings) {
      var self = this;
      if (self.mode !== 'server') { var st = JSON.parse(JSON.stringify(self.state)); st.settings = settings; return Promise.resolve(self._set(st)); }
      return api('PUT', 'api/settings', settings).then(function (st) { return self._set(st); });
    },

    adminProgress: function (patch) {
      var self = this;
      if (self.mode !== 'server') { var st = JSON.parse(JSON.stringify(self.state)); ENGINE.applyAdmin(st.progress, patch); return Promise.resolve(self._set(st)); }
      return api('POST', 'api/admin/progress', patch).then(function (st) { return self._set(st); });
    },

    replaceAll: function (data) {
      var self = this;
      if (self.mode !== 'server') return Promise.resolve(self._set(data));
      return api('PUT', 'api/import', data).then(function (st) { return self._set(st); });
    },

    audioUrl: function (key) {
      var a = this.state && this.state.audio && this.state.audio[key];
      return a ? 'media/audio/' + encodeURIComponent(a.file) + '?v=' + a.v : null;
    },
    uploadAudio: function (key, blob) {
      var self = this;
      return api('PUT', 'api/audio/' + encodeURIComponent(key), blob, true).then(function (st) { return self._set(st); });
    },
    deleteAudio: function (key) {
      var self = this;
      return api('DELETE', 'api/audio/' + encodeURIComponent(key)).then(function (st) { return self._set(st); });
    }
  };

  root.Store = Store;
})(typeof self !== 'undefined' ? self : this);
