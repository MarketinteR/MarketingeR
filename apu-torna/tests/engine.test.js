/* Egyszerű tesztek: node tests/engine.test.js */
const assert = require('assert');
const EX = require('../public/exercises.js');
const E = require('../public/engine.js');
const PH = require('../public/phrases.js');

const s = E.defaultSettings();
let p = E.defaultProgress();

// edzésterv
let items = E.buildSession(p, s, 'good');
assert.strictEqual(items.length, s.perSession, 'perSession darab');
assert.strictEqual(items[0].id, 'legzes', 'légzéssel kezd');
assert.strictEqual(items[items.length - 1].id, 'terdnyujto', 'térdnyújtó pihenéssel zár');
assert(items.every(i => EX.byId[i.id].level === 1), 'csak 1. szint');
const pain = E.buildSession(p, s, 'pain');
assert(pain.length <= 4 && pain.every(i => EX.byId[i.id].gentle), 'fájdalomnál csak kíméletes');

// fejlődés: 2× jó → +1 lépés
const cf = EX.byId.combfeszites;
let st = E.exState(p, cf);
const before = st.reps + st.hold;
E.applyFeedback(cf, st, 'good', '2026-01-01'); E.applyFeedback(cf, st, 'good', '2026-01-01');
assert.strictEqual(st.reps + st.hold, before + 1, 'két jó után nő');
E.applyFeedback(cf, st, 'easy', '2026-01-01');
assert.strictEqual(st.reps + st.hold, before + 3, 'túl kevés után +2');
E.applyFeedback(cf, st, 'much', '2026-01-01');
assert.strictEqual(st.reps + st.hold, before + 1, 'túl sok után -2');
E.applyFeedback(cf, st, 'pain', '2026-01-01'); E.applyFeedback(cf, st, 'pain', '2026-01-01');
assert.strictEqual(st.paused, true, '2× fájdalom → szünetel');
assert(st.reps >= cf.dose.reps[1] && st.hold >= cf.dose.hold[1], 'nem megy minimum alá');

// session alkalmazás + duplikáció elleni védelem + szintlépés
p = E.defaultProgress(); s.levelUpAfter = 3; s.rewards = [{ id: 'r1', text: 'Hajrá' }]; s.rewardEvery = 2;
for (let d = 1; d <= 6; d++) {
  const it = E.buildSession(p, s, 'good');
  const res = { id: 'x' + d, date: '2026-01-0' + d, feel: 'good', items: it.map(i => Object.assign({ done: true, fb: 'good' }, i)) };
  E.applySession(p, s, res); E.applySession(p, s, res);
}
assert.strictEqual(p.sessions.length, 6, 'nincs dupla feldolgozás');
assert.strictEqual(E.streak(p, '2026-01-06'), 6, 'sorozat');
assert(p.level >= 2, 'szintet lépett: ' + p.level);
assert(p.pending.some(x => x.type === 'level') && p.pending.some(x => x.type === 'reward'), 'jutalom és szintlépés függőben');
assert(p.stars > 0);
const l2 = E.buildSession(p, s, 'good');
assert(l2.some(i => EX.byId[i.id].level === 2), '2. szintű gyakorlat bekerül');

// admin
E.applyAdmin(p, { level: 1, ex: { combfeszites: { reps: 99, paused: false } } });
assert.strictEqual(p.level, 1); assert.strictEqual(p.ex.combfeszites.reps, cf.dose.reps[2]);

// mondatok
assert(PH.byKey['ex.combfeszites'] && PH.byKey['num.30']);
assert.strictEqual(PH.fill('Szia {nev}, {papa}', { name: 'Apu', kidsCall: 'Papa' }), 'Szia Apu, Papa');
EX.LIST.forEach(e => { assert(e.fig && e.steps.length && e.voice && e.why, 'hiányos: ' + e.id); });
console.log('OK – minden teszt átment (' + EX.LIST.length + ' gyakorlat, ' + PH.LIST.length + ' mondat)');
