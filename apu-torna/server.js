#!/usr/bin/env node
/*
 * Apu Torna – mini szerver (nincs külső függőség).
 * Kiszolgálja az appot, és a data/ mappában tárolja a beállításokat, a haladást és a hangfelvételeket.
 * Indítás:  node server.js        (PORT=8080, DATA_DIR=./data)
 */
'use strict';
var http = require('http');
var fs = require('fs');
var path = require('path');
var ENGINE = require('./public/engine.js');

var PORT = +process.env.PORT || 8080;
var HOST = process.env.HOST || '0.0.0.0';
var PUB = path.join(__dirname, 'public');
var DATA = process.env.DATA_DIR || path.join(__dirname, 'data');
var AUDIO = path.join(DATA, 'audio');
var BACKUP = path.join(DATA, 'backup');
var STATE_FILE = path.join(DATA, 'state.json');
[DATA, AUDIO, BACKUP].forEach(function (d) { fs.mkdirSync(d, { recursive: true }); });

var MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.webm': 'audio/webm', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.mp4': 'audio/mp4', '.wav': 'audio/wav'
};
var AUDIO_EXT = { 'audio/webm': '.webm', 'audio/ogg': '.ogg', 'audio/mpeg': '.mp3', 'audio/mp3': '.mp3', 'audio/mp4': '.m4a', 'audio/x-m4a': '.m4a', 'audio/aac': '.m4a', 'audio/wav': '.wav', 'audio/x-wav': '.wav', 'video/webm': '.webm' };

// ── állapot ──
var state;
function load() {
  try { state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); }
  catch (e) { state = {}; }
  state.settings = Object.assign(ENGINE.defaultSettings(), state.settings || {});
  state.progress = Object.assign(ENGINE.defaultProgress(), state.progress || {});
  state.audio = state.audio || {};
  state.rev = state.rev || 0;
}
function save() {
  state.rev++;
  var tmp = STATE_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(state));
  fs.renameSync(tmp, STATE_FILE);
  // napi biztonsági mentés (az utolsó 30 nap marad meg)
  var b = path.join(BACKUP, 'state-' + ENGINE.localDate() + '.json');
  if (!fs.existsSync(b)) {
    fs.copyFileSync(STATE_FILE, b);
    var files = fs.readdirSync(BACKUP).filter(function (f) { return /^state-.*\.json$/.test(f); }).sort();
    files.slice(0, Math.max(0, files.length - 30)).forEach(function (f) { try { fs.unlinkSync(path.join(BACKUP, f)); } catch (e) { } });
  }
}
function publicState() {
  return { settings: state.settings, progress: state.progress, audio: state.audio, rev: state.rev, _server: true };
}
load();

// ── segédek ──
function send(res, code, obj) {
  var body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}
function readBody(req, limit) {
  return new Promise(function (resolve, reject) {
    var chunks = [], size = 0;
    req.on('data', function (c) {
      size += c.length;
      if (size > limit) { reject(new Error('too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', function () { resolve(Buffer.concat(chunks)); });
    req.on('error', reject);
  });
}
function readJson(req) {
  return readBody(req, 20 * 1024 * 1024).then(function (b) { return JSON.parse(b.toString('utf8') || '{}'); });
}
function serveFile(res, file, cache) {
  fs.stat(file, function (err, st) {
    if (err || !st.isFile()) { res.writeHead(404); return res.end('Nincs ilyen'); }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': st.size,
      'Cache-Control': cache || 'no-cache'
    });
    fs.createReadStream(file).pipe(res);
  });
}
var KEY_RE = /^[a-zA-Z0-9._-]{1,80}$/;

// ── útvonalak ──
function handle(req, res) {
  var u = new URL(req.url, 'http://x');
  var p = decodeURIComponent(u.pathname);
  var m;

  if (p === '/api/state' && req.method === 'GET') return send(res, 200, publicState());

  if (p === '/api/session' && req.method === 'POST') {
    return readJson(req).then(function (result) {
      ENGINE.applySession(state.progress, state.settings, result);
      save(); send(res, 200, publicState());
    });
  }

  if (p === '/api/settings' && req.method === 'PUT') {
    return readJson(req).then(function (s) {
      state.settings = Object.assign(ENGINE.defaultSettings(), s);
      save(); send(res, 200, publicState());
    });
  }

  if (p === '/api/admin/progress' && req.method === 'POST') {
    return readJson(req).then(function (patch) {
      ENGINE.applyAdmin(state.progress, patch);
      save(); send(res, 200, publicState());
    });
  }

  if (p === '/api/import' && req.method === 'PUT') {
    return readJson(req).then(function (d) {
      if (d.settings) state.settings = Object.assign(ENGINE.defaultSettings(), d.settings);
      if (d.progress) state.progress = Object.assign(ENGINE.defaultProgress(), d.progress);
      save(); send(res, 200, publicState());
    });
  }

  if ((m = p.match(/^\/api\/audio\/(.+)$/))) {
    var key = m[1];
    if (!KEY_RE.test(key)) return send(res, 400, { error: 'rossz kulcs' });
    if (req.method === 'PUT') {
      return readBody(req, 15 * 1024 * 1024).then(function (buf) {
        if (!buf.length) return send(res, 400, { error: 'üres' });
        var type = (req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
        var ext = AUDIO_EXT[type] || '.webm';
        var old = state.audio[key];
        if (old) { try { fs.unlinkSync(path.join(AUDIO, old.file)); } catch (e) { } }
        var file = key + ext;
        fs.writeFileSync(path.join(AUDIO, file), buf);
        state.audio[key] = { file: file, v: Date.now() };
        save(); send(res, 200, publicState());
      });
    }
    if (req.method === 'DELETE') {
      var a = state.audio[key];
      if (a) { try { fs.unlinkSync(path.join(AUDIO, a.file)); } catch (e) { } delete state.audio[key]; save(); }
      return send(res, 200, publicState());
    }
  }

  if ((m = p.match(/^\/media\/audio\/([^/]+)$/)) && req.method === 'GET') {
    if (!/^[a-zA-Z0-9._-]+$/.test(m[1])) { res.writeHead(400); return res.end(); }
    return serveFile(res, path.join(AUDIO, m[1]), 'public, max-age=31536000, immutable');
  }

  if (req.method === 'GET' || req.method === 'HEAD') {
    var rel = p === '/' ? '/index.html' : p;
    if (rel === '/admin') rel = '/admin.html';
    var file = path.normalize(path.join(PUB, rel));
    if (file.indexOf(PUB) !== 0) { res.writeHead(403); return res.end(); }
    return serveFile(res, file);
  }

  res.writeHead(404); res.end();
}

http.createServer(function (req, res) {
  Promise.resolve().then(function () { return handle(req, res); }).catch(function (e) {
    console.error(e);
    if (!res.headersSent) send(res, 500, { error: String(e.message || e) });
  });
}).listen(PORT, HOST, function () {
  console.log('Apu Torna fut: http://' + HOST + ':' + PORT + '  (adatok: ' + DATA + ')');
});
