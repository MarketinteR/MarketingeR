/*
 * Gyakorlat-könyvtár – kifejezetten Apura szabva:
 *  - jobb kar: könyök fölött amputálva (csonk)
 *  - bal láb: térd fölött amputálva (csonk)
 *  - legyengült, a megmaradt (jobb) térdét nem tudja teljesen kinyújtani
 * Cél: a jobb térd kinyújtása, a csípő kiegyenesítése, erősödés a felállásig.
 *
 * dose: [kezdő, minimum, maximum, lépés]
 * type: reps (ismétlés) | hold (ismétlés × tartás mp) | timer (idő mp) | breath (légzés)
 * fig: a rajz – view: supine | top | sit | prone; a = kiinduló, b = végállás (ízület-koordináták)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.EXERCISES = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  var LEVELS = [
    { n: 1, name: 'Alapozás az ágyban', short: 'Alapozás', goal: 'Átmozgatás, térdnyújtás, vérkeringés' },
    { n: 2, name: 'Erősítés az ágyban', short: 'Erősítés', goal: 'Erős comb, erős csípő, erős kar' },
    { n: 3, name: 'Ülés az ágy szélén', short: 'Ülés', goal: 'Önálló felülés és biztos ülés' },
    { n: 4, name: 'Felállás kísérővel', short: 'Felállás', goal: 'Első felállások járókerettel' },
    { n: 5, name: 'Erős lábon', short: 'Erős lábon', goal: 'Állás és felállás-sorozatok' }
  ];

  var LIST = [
    // ───────────── 1. SZINT – ALAPOZÁS AZ ÁGYBAN ─────────────
    {
      id: 'legzes', level: 1, name: 'Mély légzés', type: 'breath', gentle: true, first: true,
      dose: { reps: [5, 4, 8, 1] }, tempo: 9,
      why: 'Felébreszti a testet, oxigént visz az izmokba.',
      steps: ['Feküdj kényelmesen a hátadon.', 'Lassan szívd be a levegőt az orrodon.', 'Fújd ki a szádon, mintha gyertyát fújnál el.'],
      voice: 'Kezdjük egy kis légzéssel. Lassan szívd be a levegőt az orrodon, aztán fújd ki a szádon, mintha a szülinapi tortán fújnád el a gyertyát.',
      fig: { view: 'supine', active: ['torso'], pulse: true }
    },
    {
      id: 'bokapumpa', level: 1, name: 'Bokapumpa', type: 'reps', gentle: true,
      dose: { reps: [12, 10, 30, 2] }, tempo: 2,
      why: 'Beindítja a vérkeringést a lábadban.',
      steps: ['A jobb lábad legyen nyújtva.', 'Húzd a lábfejed magad felé.', 'Aztán nyomd el, mintha gázt adnál.'],
      voice: 'Bokapumpa. Húzd a jobb lábfejed magad felé, aztán nyomd el, mintha gázt adnál a kocsiban. Én számolok.',
      fig: { view: 'supine', active: ['rleg'], a: { rtoe: [271, 108] }, b: { rtoe: [284, 124] } }
    },
    {
      id: 'combfeszites', level: 1, name: 'Combfeszítés – térd le!', type: 'hold', core: true, gentle: true,
      dose: { reps: [6, 4, 15, 1], hold: [5, 3, 10, 1] },
      why: 'A legfontosabb gyakorlat: ettől nyúlik ki a térded.',
      steps: ['A jobb lábad legyen nyújtva az ágyon.', 'Nyomd a térded hátulját le az ágyba, feszítsd meg a combod.', 'Tartsd, amíg számolok, aztán engedd el.'],
      voice: 'Combfeszítés, ez a legfontosabb. Nyomd a jobb térded hátulját le az ágyba, és feszítsd meg erősen a combodat, mintha egy kis labdát nyomnál le. Tartsd, amíg számolok, aztán engedd el.',
      fig: { view: 'supine', active: ['rleg'], props: ['towelKnee'], a: { rknee: [214, 119] }, b: { rknee: [214, 126] } }
    },
    {
      id: 'sarokcsusztatas', level: 1, name: 'Sarokcsúsztatás', type: 'reps',
      dose: { reps: [6, 4, 20, 1] }, tempo: 5,
      why: 'Mozgékony térd, laza ízület.',
      steps: ['Csúsztasd a jobb sarkad a feneked felé.', 'Hajlítsd a térded, amennyire kényelmes.', 'Csúsztasd vissza egészen nyújtott térdig.'],
      voice: 'Sarokcsúsztatás. Csúsztasd a jobb sarkadat az ágyon a feneked felé, aztán vissza, egészen addig, amíg a térded kinyúlik. Lassan, szépen.',
      fig: { view: 'supine', active: ['rleg'], b: { rknee: [198, 98], rank: [230, 127], rtoe: [248, 130] } }
    },
    {
      id: 'rovidiv', level: 1, name: 'Rövid térdnyújtás', type: 'hold', core: true,
      dose: { reps: [6, 4, 20, 1], hold: [2, 2, 5, 1] },
      why: 'Erősíti a combot pont ott, ahol a térd kinyúlik.',
      steps: ['Tedd a feltekert törölközőt a jobb térded alá.', 'Emeld fel a sarkad, nyújtsd ki teljesen a térded.', 'Tartsd, aztán lassan engedd le.'],
      voice: 'Rövid térdnyújtás. A feltekert törölköző legyen a jobb térded alatt. Emeld fel a sarkadat, nyújtsd ki teljesen a térdedet, tartsd meg, aztán lassan engedd le.',
      fig: { view: 'supine', active: ['rleg'], props: ['rollKnee'], a: { rknee: [212, 110], rank: [262, 127], rtoe: [268, 110] }, b: { rknee: [212, 110], rank: [262, 106], rtoe: [276, 92] } }
    },
    {
      id: 'csonknyomas', level: 1, name: 'Csonk lenyomás', type: 'hold', core: true, gentle: true,
      dose: { reps: [6, 4, 15, 1], hold: [5, 3, 10, 1] },
      why: 'Kiegyenesíti a csípődet – ez kell a felálláshoz.',
      steps: ['Tedd a feltekert törölközőt a bal combod alá.', 'Nyomd a csonkot lefelé, bele a törölközőbe.', 'Feszítsd a farizmod, tartsd, aztán engedd el.'],
      voice: 'Csonk lenyomás. Tedd a feltekert törölközőt a bal combod alá, és nyomd erősen lefelé, bele az ágyba. Közben szorítsd meg a farizmodat. Tartsd, aztán engedd el.',
      fig: { view: 'supine', active: ['lstub'], props: ['rollStub'], a: { lstub: [196, 112] }, b: { lstub: [196, 120] } }
    },
    {
      id: 'farszoritas', level: 1, name: 'Farizom szorítás', type: 'hold', gentle: true,
      dose: { reps: [6, 4, 15, 1], hold: [5, 3, 10, 1] },
      why: 'Erős far = stabil csípő álláskor.',
      steps: ['Feküdj a hátadon.', 'Szorítsd össze erősen a farizmaidat.', 'Tartsd, aztán engedd el.'],
      voice: 'Farizom szorítás. Szorítsd össze erősen a farizmaidat, és tartsd, amíg számolok. Aztán engedd el.',
      fig: { view: 'supine', active: ['hip'], pulse: true }
    },
    {
      id: 'csonkoldalra', level: 1, name: 'Csonk oldalra', type: 'reps',
      dose: { reps: [6, 4, 15, 1] }, tempo: 4,
      why: 'Erősíti a csípő oldalsó izmait.',
      steps: ['Feküdj a hátadon.', 'Csúsztasd a bal combod oldalra, kifelé.', 'Aztán vissza középre.'],
      voice: 'Csonk oldalra. Csúsztasd a bal combodat az ágyon oldalra, kifelé, aztán vissza középre.',
      fig: { view: 'top', active: ['lstub'], b: { lstub: [192, 58] } }
    },
    {
      id: 'karemeles', level: 1, name: 'Bal kar emelés', type: 'reps',
      dose: { reps: [6, 4, 15, 1] }, tempo: 4,
      why: 'Erős kar a felüléshez, kapaszkodáshoz.',
      steps: ['Emeld fel a bal karod a fejed fölé.', 'Amilyen magasra csak tudod.', 'Lassan engedd vissza. Ha már könnyű: fogj egy kis üveg vizet.'],
      voice: 'Bal kar emelés. Emeld fel a bal karodat egyenesen a fejed fölé, amilyen magasra tudod, aztán lassan engedd vissza. Ha már könnyű, fogj a kezedbe egy kis üveg vizet.',
      fig: { view: 'top', active: ['larm'], b: { lelb: [46, 70], lhand: [16, 66] } }
    },
    {
      id: 'vallkorzes', level: 1, name: 'Vállkörzés', type: 'reps', gentle: true,
      dose: { reps: [6, 4, 15, 1] }, tempo: 3,
      why: 'Laza vállak, a jobb oldali is dolgozik.',
      steps: ['Húzd fel mindkét vállad a füledhez.', 'Körözz hátra.', 'Engedd le lazán.'],
      voice: 'Vállkörzés. Húzd fel mindkét válladat a füledhez, körözz hátra, és engedd le. A jobb vállad is dolgozzon!',
      fig: { view: 'top', active: ['larm', 'rstub'], b: { lsh: [70, 80], rsh: [70, 120], relb: [92, 130], lelb: [100, 68], lhand: [132, 66] } }
    },
    {
      id: 'csonkkar', level: 1, name: 'Jobb váll előre', type: 'reps', gentle: true,
      dose: { reps: [6, 4, 15, 1] }, tempo: 3,
      why: 'Erős jobb váll a fordulásokhoz.',
      steps: ['Emeld a jobb karod előre, a plafon felé.', 'A vállból mozdulj, amennyire megy.', 'Engedd vissza lassan.'],
      voice: 'Jobb váll előre. Emeld a jobb karodat a vállból előre, a plafon felé, amennyire megy, aztán engedd vissza.',
      fig: { view: 'supine', active: ['rstub'], b: { relb: [86, 92] } }
    },
    {
      id: 'terdnyujto', level: 1, name: 'Térdnyújtó pihenés', type: 'timer', core: true, gentle: true, last: true,
      dose: { time: [60, 45, 300, 15] },
      why: 'A gravitáció lassan, magától kinyújtja a térdedet.',
      steps: ['Tedd a feltekert törölközőt a jobb sarkad alá.', 'A térded alatt ne legyen semmi.', 'Lazíts. Enyhe húzás jó – fájdalom nem!'],
      voice: 'Térdnyújtó pihenés. Tedd a feltekert törölközőt a jobb sarkad alá, a térded alatt ne legyen semmi. Most csak lazíts, és engedd, hogy a térded lassan lesüllyedjen. Egy kis húzás jó, fájdalom nem.',
      caution: 'Csak enyhe húzás legyen. Ha fáj, állj meg!',
      fig: { view: 'supine', active: ['rleg'], props: ['rollHeel'], a: { rknee: [214, 114], rank: [264, 116], rtoe: [270, 100] }, b: { rknee: [214, 120], rank: [264, 116], rtoe: [270, 100] } }
    },

    // ───────────── 2. SZINT – ERŐSÍTÉS AZ ÁGYBAN ─────────────
    {
      id: 'hid', level: 2, name: 'Híd', type: 'hold', core: true,
      dose: { reps: [4, 3, 12, 1], hold: [3, 2, 6, 1] },
      why: 'Erős far és comb – ezekkel állsz majd fel.',
      steps: ['Hajlítsd be a jobb térded, talp az ágyon.', 'A bal combod alá tegyél párnát.', 'Nyomd a talpad az ágyba, emeld a csípőd. Tartsd, aztán le.'],
      voice: 'Híd. Hajlítsd be a jobb térdedet, a talpad legyen az ágyon, a bal combod alatt egy párna. Nyomd a talpadat az ágyba, és emeld meg a csípődet. Tartsd, aztán lassan engedd le.',
      fig: { view: 'supine', active: ['rleg', 'hip'], props: ['rollStub'], a: { rknee: [200, 96], rank: [228, 127], rtoe: [246, 130], lstub: [196, 112] }, b: { pel: [160, 108], lhip: [160, 108], rhip: [160, 108], rknee: [206, 92], rank: [228, 127], rtoe: [246, 130], lstub: [196, 106] } }
    },
    {
      id: 'egyenesemeles', level: 2, name: 'Egyenes lábemelés', type: 'hold',
      dose: { reps: [4, 3, 12, 1], hold: [2, 2, 5, 1] },
      why: 'Erős comb és egyenes térd egyszerre.',
      steps: ['Feszítsd meg a jobb combod, térd egyenes.', 'Emeld fel a lábad egy arasznyira.', 'Tartsd, aztán lassan engedd le.'],
      voice: 'Egyenes lábemelés. Feszítsd meg a jobb combodat, hogy egyenes legyen a térded, és emeld fel a lábadat egy arasznyira. Tartsd, aztán lassan engedd le.',
      fig: { view: 'supine', active: ['rleg'], b: { rknee: [211, 108], rank: [259, 93], rtoe: [262, 76] } }
    },
    {
      id: 'hasonpihenes', level: 2, name: 'Hason pihenés', type: 'timer', core: true, last: true, helper: true,
      dose: { time: [120, 60, 900, 60] },
      why: 'A sok fekvés ellenszere: kinyújtja a csípődet.',
      steps: ['Fordulj hasra – ha kell, kérj segítséget.', 'Tedd a fejed a karodra.', 'Pihenj így nyugodtan.'],
      voice: 'Hason pihenés. Fordulj hasra, ha kell, kérj hozzá segítséget. Tedd a fejedet a karodra, és pihenj így nyugodtan. Ez kinyújtja a csípődet.',
      caution: 'Az első pár alkalommal legyen melletted valaki.',
      fig: { view: 'prone', active: ['lstub', 'hip'], pulse: true }
    },
    {
      id: 'fejemeles', level: 2, name: 'Fejemelés – hasizom', type: 'reps',
      dose: { reps: [5, 3, 12, 1] }, tempo: 4,
      why: 'Erős has a felüléshez.',
      steps: ['Húzd az állad a mellkasodhoz.', 'Emeld meg kicsit a fejed és a vállad.', 'Fújd ki közben a levegőt, aztán vissza.'],
      voice: 'Fejemelés. Húzd az álladat a mellkasodhoz, és emeld meg egy kicsit a fejedet és a válladat. Közben fújd ki a levegőt, aztán engedd vissza.',
      fig: { view: 'supine', active: ['torso'], b: { head: [56, 94], neck: [72, 108], lsh: [82, 114], rsh: [82, 114], relb: [106, 122], lelb: [108, 124] } }
    },
    {
      id: 'konyoknyomas', level: 2, name: 'Bal kar nyomás', type: 'hold',
      dose: { reps: [5, 4, 12, 1], hold: [3, 3, 8, 1] },
      why: 'Erős kar a feltoláshoz és a felálláshoz.',
      steps: ['Tedd a bal tenyered az ágyra a tested mellé.', 'Nyomd le erősen a könyököd és a tenyered.', 'Tartsd, aztán engedd el.'],
      voice: 'Bal kar nyomás. Nyomd a bal könyöködet és a tenyeredet erősen le az ágyba, mintha fel akarnád tolni magad. Tartsd, aztán engedd el.',
      fig: { view: 'top', active: ['larm'], pulse: true, a: { lelb: [104, 60], lhand: [138, 56] } }
    },

    // ───────────── 3. SZINT – ÜLÉS AZ ÁGY SZÉLÉN ─────────────
    {
      id: 'felules', level: 3, name: 'Felülés az ágy szélére', type: 'reps', core: true, helper: true,
      dose: { reps: [2, 1, 5, 1] }, tempo: 14,
      why: 'Ez az első lépés a felállás felé.',
      steps: ['Fordulj az oldaladra, az ágy széle felé.', 'Told le a lábad az ágy szélén.', 'A bal kezeddel told fel magad ülésbe – aztán ugyanígy vissza.'],
      voice: 'Felülés az ágy szélére. Fordulj az oldaladra, told le a lábadat az ágy szélén, és a bal kezeddel told fel magad ülésbe. Lassan, nyugodtan. Aztán ugyanígy vissza.',
      fig: { view: 'sit', active: ['larm', 'torso'], pulse: true }
    },
    {
      id: 'egyenesules', level: 3, name: 'Egyenes ülés', type: 'timer',
      dose: { time: [30, 30, 180, 15] },
      why: 'Biztos ülés = szabad kéz, szabad élet.',
      steps: ['Ülj az ágy szélén, talp a földön.', 'Húzd ki magad, nézz előre.', 'Ha szédülsz, feküdj vissza.'],
      voice: 'Egyenes ülés. Ülj az ágy szélén, a talpad legyen a földön. Húzd ki magad, és nézz előre, mintha az unokáidat néznéd a kertben.',
      caution: 'Ha szédülsz, feküdj vissza!',
      fig: { view: 'sit', active: ['torso'], pulse: true }
    },
    {
      id: 'ulonyujtas', level: 3, name: 'Ülő térdnyújtás', type: 'hold', core: true,
      dose: { reps: [6, 4, 15, 1], hold: [2, 2, 5, 1] },
      why: 'Ülve is a térd kinyújtásán dolgozunk.',
      steps: ['Ülj egyenesen az ágy szélén.', 'Nyújtsd ki a jobb térded előre, amennyire tudod.', 'Tartsd, aztán lassan engedd vissza.'],
      voice: 'Ülő térdnyújtás. Ülve nyújtsd ki a jobb térdedet előre, amennyire csak tudod. Tartsd, aztán lassan engedd vissza.',
      fig: { view: 'sit', active: ['rleg'], b: { rank: [212, 112], rtoe: [218, 94] } }
    },
    {
      id: 'eloredoles', level: 3, name: 'Előredőlés', type: 'reps',
      dose: { reps: [5, 4, 12, 1] }, tempo: 5,
      why: 'Így kezdődik minden felállás: orr a lábujj fölé.',
      steps: ['Ülj az ágy szélén, talp a földön.', 'Dőlj előre, orr a lábujjad fölé.', 'Aztán egyenesedj vissza.'],
      voice: 'Előredőlés. Ülve dőlj előre, mintha az orrodat a lábujjad fölé vinnéd, aztán egyenesedj vissza. Ez kell majd a felálláshoz.',
      fig: { view: 'sit', active: ['torso'], b: { head: [140, 62], neck: [130, 76], lsh: [126, 82], rsh: [126, 82], relb: [136, 106], lelb: [118, 104], lhand: [132, 126] } }
    },
    {
      id: 'kezitamasz', level: 3, name: 'Ülő kéztámasz', type: 'reps',
      dose: { reps: [3, 2, 10, 1] }, tempo: 5,
      why: 'Erős kar a felálláshoz és az átüléshez.',
      steps: ['Tedd a bal tenyered az ágyra a csípőd mellé.', 'Nyomd le erősen, próbáld megemelni a feneked.', 'Lassan vissza.'],
      voice: 'Ülő kéztámasz. Tedd a bal tenyeredet az ágyra a csípőd mellé, nyomd le erősen, és próbáld egy kicsit megemelni a feneked. Aztán lassan vissza.',
      fig: { view: 'sit', active: ['larm'], b: { head: [100, 40], neck: [100, 56], lsh: [100, 64], rsh: [100, 64], relb: [104, 92], lelb: [92, 96], pel: [104, 118], lhip: [106, 118], rhip: [106, 118], rknee: [158, 122], lstub: [140, 120] } }
    },
    {
      id: 'ulosarok', level: 3, name: 'Sarokemelés ülve', type: 'reps', gentle: true,
      dose: { reps: [10, 8, 25, 2] }, tempo: 2,
      why: 'Erős vádli, biztos talp.',
      steps: ['Ülj, a talpad a földön.', 'Emeld fel a sarkad, lábujj marad.', 'Engedd le.'],
      voice: 'Sarokemelés ülve. Emeld fel a jobb sarkadat, a lábujjad maradjon a földön, aztán engedd le.',
      fig: { view: 'sit', active: ['rleg'], b: { rknee: [158, 120], rank: [160, 174], rtoe: [176, 188] } }
    },
    {
      id: 'csonkhatra', level: 3, name: 'Csonk emelés hason', type: 'hold',
      dose: { reps: [4, 3, 12, 1], hold: [3, 2, 6, 1] },
      why: 'Erős csípőfeszítő – egyenes testtartás álláskor.',
      steps: ['Feküdj hason.', 'Emeld a bal combod kicsit az ágyról felfelé.', 'Tartsd, aztán engedd le.'],
      voice: 'Csonk emelés hason. Hason fekve emeld a bal combodat egy kicsit felfelé az ágyról. Tartsd, aztán engedd le.',
      fig: { view: 'prone', active: ['lstub'], b: { lstub: [194, 106] } }
    },

    // ───────────── 4. SZINT – FELÁLLÁS KÍSÉRŐVEL ─────────────
    {
      id: 'felallas', level: 4, name: 'Felállás segítséggel', type: 'reps', core: true, helper: true,
      dose: { reps: [1, 1, 5, 1] }, tempo: 18,
      why: 'Ezért dolgoztunk! Felállni – az unokák elé.',
      steps: ['CSAK ha valaki ott van melletted!', 'Járókeret előtted. Dőlj előre, orr a lábujj fölé.', 'Nyomd a talpad a földbe, állj fel. Aztán lassan vissza.'],
      voice: 'Felállás. Csak akkor csináld, ha ott van melletted valaki! A járókeret legyen előtted. Dőlj előre, orr a lábujj fölé, nyomd a talpadat a földbe, és állj fel. Aztán lassan ülj vissza.',
      caution: 'Csak kísérővel!',
      fig: { view: 'sit', active: ['rleg', 'larm'], props: ['walker'], b: 'stand' }
    },
    {
      id: 'allas', level: 4, name: 'Állás kapaszkodva', type: 'timer', helper: true,
      dose: { time: [10, 10, 60, 5] },
      why: 'Minden másodperc állás egy lépés a cél felé.',
      steps: ['CSAK kísérővel!', 'Kapaszkodj a járókeretbe, állj egyenesen.', 'Ha elfáradtál, ülj vissza.'],
      voice: 'Állás kapaszkodva. Kapaszkodj a járókeretbe, és állj egyenesen. Nézz előre. Ha elfáradtál, ülj vissza.',
      caution: 'Csak kísérővel!',
      fig: { view: 'sit', active: ['rleg'], props: ['walker'], a: 'stand', pulse: true }
    },

    // ───────────── 5. SZINT – ERŐS LÁBON ─────────────
    {
      id: 'felallassor', level: 5, name: 'Felállás–leülés sorozat', type: 'reps', core: true, helper: true,
      dose: { reps: [2, 2, 8, 1] }, tempo: 14,
      why: 'Erős láb, önálló élet.',
      steps: ['Kísérővel, járókerettel.', 'Állj fel, állj meg egy pillanatra.', 'Lassan, fékezve ülj vissza.'],
      voice: 'Felállás, leülés sorozat. Állj fel a járókerettel, állj meg egy pillanatra, aztán lassan, fékezve ülj vissza.',
      caution: 'Csak kísérővel!',
      fig: { view: 'sit', active: ['rleg', 'larm'], props: ['walker'], b: 'stand' }
    },
    {
      id: 'allasfordul', level: 5, name: 'Állás és körülnézés', type: 'timer', helper: true,
      dose: { time: [20, 15, 120, 10] },
      why: 'Biztos egyensúly, szabad tekintet.',
      steps: ['Kísérővel, járókerettel.', 'Állj egyenesen.', 'Fordítsd a fejed lassan jobbra, majd balra.'],
      voice: 'Állás és körülnézés. Állj egyenesen a járókerettel, és lassan fordítsd a fejedet jobbra, majd balra.',
      caution: 'Csak kísérővel!',
      fig: { view: 'sit', active: ['torso'], props: ['walker'], a: 'stand', pulse: true }
    }
  ];

  var byId = {};
  LIST.forEach(function (e) { byId[e.id] = e; });

  return { LEVELS: LEVELS, LIST: LIST, byId: byId };
});
