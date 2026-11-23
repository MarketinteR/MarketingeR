/*
 * Minden mondat, amit az app kimond. Az admin oldalon mindegyiket fel tudod venni a saját hangodon.
 * Ha nincs felvétel, a tablet gépi hangja (magyar TTS) olvassa fel a szöveget.
 * {nev} = ahogy szólítod (pl. Apu), {papa} = ahogy az unokák hívják, {unoka} = egy unoka neve
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./exercises.js'));
  else root.PHRASES = factory(root.EXERCISES);
})(typeof self !== 'undefined' ? self : this, function (EX) {
  var LIST = [
    // Köszönés, emlékeztető
    { key: 'greet.morning', group: 'Köszönés és emlékeztető', text: 'Jó reggelt, {nev}! Ma is erősebb leszel, mint tegnap.' },
    { key: 'greet.day', group: 'Köszönés és emlékeztető', text: 'Szia, {nev}! Jó, hogy itt vagy.' },
    { key: 'greet.evening', group: 'Köszönés és emlékeztető', text: 'Jó estét, {nev}! Még egy kis mozgás, és szép éjszakád lesz.' },
    { key: 'remind.1', group: 'Köszönés és emlékeztető', text: '{nev}, itt az idő egy kis tornára! Az unokák szurkolnak neked.' },
    { key: 'remind.2', group: 'Köszönés és emlékeztető', text: '{nev}, gyere, tornázzunk egy kicsit! Csak pár perc az egész.' },
    { key: 'remind.3', group: 'Köszönés és emlékeztető', text: '{nev}, még mindig várlak! Nyomd meg a nagy gombot, és kezdjük.' },
    { key: 'remind.4', group: 'Köszönés és emlékeztető', text: 'Na, {nev}, ne hagyd ki! Minden torna egy lépés az unokák felé.' },

    // Hangulat
    { key: 'feel.ask', group: 'Hangulat', text: 'Hogy érzed magad most, {nev}?' },
    { key: 'feel.great', group: 'Hangulat', text: 'Szuper! Akkor ma bele is húzunk egy kicsit.' },
    { key: 'feel.good', group: 'Hangulat', text: 'Ennek örülök! Akkor kezdjük.' },
    { key: 'feel.tired', group: 'Hangulat', text: 'Értem. Ma egy kicsit könnyebb lesz, de azért megcsináljuk, jó?' },
    { key: 'feel.pain', group: 'Hangulat', text: 'Sajnálom. Ma csak nagyon kíméletes gyakorlatokat csinálunk. Ha erősen fáj, szólj valakinek.' },

    // Edzés közben
    { key: 'start', group: 'Edzés közben', text: 'Rajta! Csináljuk együtt.' },
    { key: 'go', group: 'Edzés közben', text: 'Mehet!' },
    { key: 'hold.start', group: 'Edzés közben', text: 'Feszíts!' },
    { key: 'hold.end', group: 'Edzés közben', text: 'Engedd el.' },
    { key: 'breath.in', group: 'Edzés közben', text: 'Szívd be…' },
    { key: 'breath.out', group: 'Edzés közben', text: 'Fújd ki…' },
    { key: 'half', group: 'Edzés közben', text: 'Félúton vagy, nagyon ügyes!' },
    { key: 'last2', group: 'Edzés közben', text: 'Még kettő!' },
    { key: 'last1', group: 'Edzés közben', text: 'Utolsó!' },
    { key: 'timer.half', group: 'Edzés közben', text: 'Félidő. Lazíts, csak lélegezz nyugodtan.' },
    { key: 'timer.end10', group: 'Edzés közben', text: 'Még tíz másodperc.' },
    { key: 'ex.done', group: 'Edzés közben', text: 'Megvan! Ügyes vagy.' },
    { key: 'next', group: 'Edzés közben', text: 'Jöhet a következő.' },
    { key: 'lastex', group: 'Edzés közben', text: 'Ez az utolsó gyakorlat mára!' },
    { key: 'paused', group: 'Edzés közben', text: 'Szünet. Ha készen állsz, nyomd meg a folytatás gombot.' },

    // Visszajelzés
    { key: 'fb.ask', group: 'Visszajelzés', text: 'Hogy ment ez a gyakorlat?' },
    { key: 'fb.easy', group: 'Visszajelzés', text: 'Hű, de erős vagy! Legközelebb többet csinálunk.' },
    { key: 'fb.good', group: 'Visszajelzés', text: 'Nagyon jó! Így tovább.' },
    { key: 'fb.hard', group: 'Visszajelzés', text: 'Nehéz volt, de megcsináltad. Erre büszke lehetsz!' },
    { key: 'fb.much', group: 'Visszajelzés', text: 'Rendben, legközelebb kicsit kevesebb lesz.' },
    { key: 'fb.fail', group: 'Visszajelzés', text: 'Semmi baj, legközelebb könnyebben megy majd. Már az is számít, hogy megpróbáltad.' },
    { key: 'fb.pain', group: 'Visszajelzés', text: 'Jól tetted, hogy szóltál. Ezt most kíméletesebben csináljuk. Folytassuk, vagy elég mára?' },

    // Vége, jutalom
    { key: 'done', group: 'Vége és jutalom', text: 'Ügyes voltál, {nev}! Mára ennyi, nagyon büszke vagyok rád.' },
    { key: 'done.stop', group: 'Vége és jutalom', text: 'Rendben, mára elég. Pihenj, és később folytatjuk.' },
    { key: 'reward', group: 'Vége és jutalom', text: 'Üzeneted jött az unokáktól!' },
    { key: 'levelup', group: 'Vége és jutalom', text: 'Gratulálok, {nev}! Szintet léptél! Egyre közelebb vagy a célhoz.' },
    { key: 'streak', group: 'Vége és jutalom', text: 'Már több napja tornázol egymás után. Csak így tovább!' },
    { key: 'praise.1', group: 'Vége és jutalom', text: 'Az unokáid büszkék lesznek rád!' },
    { key: 'praise.2', group: 'Vége és jutalom', text: 'Minden egyes torna közelebb visz ahhoz, hogy felállj.' },
    { key: 'praise.3', group: 'Vége és jutalom', text: 'Erős vagy, {nev}. Erősebb, mint gondolnád.' },
    { key: 'praise.4', group: 'Vége és jutalom', text: 'Ma is tettél magadért. Ez az igazi bajnok!' }
  ];

  EX.LIST.forEach(function (e) {
    LIST.push({ key: 'ex.' + e.id, group: 'Gyakorlatok leírása', text: e.voice });
  });
  var NUM = ['egy', 'kettő', 'három', 'négy', 'öt', 'hat', 'hét', 'nyolc', 'kilenc', 'tíz', 'tizenegy', 'tizenkettő', 'tizenhárom', 'tizennégy', 'tizenöt', 'tizenhat', 'tizenhét', 'tizennyolc', 'tizenkilenc', 'húsz', 'huszonegy', 'huszonkettő', 'huszonhárom', 'huszonnégy', 'huszonöt', 'huszonhat', 'huszonhét', 'huszonnyolc', 'huszonkilenc', 'harminc'];
  NUM.forEach(function (t, i) { LIST.push({ key: 'num.' + (i + 1), group: 'Számolás', text: t }); });

  var byKey = {};
  LIST.forEach(function (p) { byKey[p.key] = p; });

  function fill(text, settings, extra) {
    settings = settings || {};
    var kids = settings.grandkids || [];
    var kid = (extra && extra.unoka) || (kids.length ? kids[Math.floor(Math.random() * kids.length)].name : 'az unokák');
    return String(text)
      .replace(/\{nev\}/g, settings.name || 'Apu')
      .replace(/\{papa\}/g, settings.kidsCall || 'Papa')
      .replace(/\{unoka\}/g, kid);
  }

  return { LIST: LIST, byKey: byKey, fill: fill };
});
