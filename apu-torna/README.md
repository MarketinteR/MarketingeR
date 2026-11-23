# 💪 Apu Torna

Tornáztató app Apunak. Teljes képernyőn fut egy tableten, a te hangodon vezeti a gyakorlatokat, és a visszajelzései alapján fokozatosan nehezít. Célja, hogy kinyúljon a lába, és megerősödjön annyira, hogy fel tudjon állni.

**Kinek szól:** 63 éves, a jobb karja könyök fölött, a bal lába térd fölött amputálva, legyengült, a jobb térdét nem tudja teljesen kinyújtani, és sokat fekszik.

> ⚠️ **Mielőtt elkezditek:** mutasd meg a gyakorlatlistát (admin → Gyakorlatok) a kezelőorvosnak vagy egy gyógytornásznak. Az adagokat ott helyben át tudjátok állítani. A 4–5. szint gyakorlatai (felállás, állás) **csak kísérővel** végezhetők, az app ezt ki is írja.

---

## Mit tud

| | |
|---|---|
| 🗓 **Napirend és emlékeztető** | Naponta 3 időpont (állítható). Ha eljön az idő, teljes képernyős emlékeztető jelenik meg egy unoka fotójával és a hangoddal. 15 percenként ismétli, legfeljebb 6-szor; éjszaka csendben marad. |
| 🎙 **A te hangod** | Az admin oldalon mind a ~100 mondatot felveheted (instrukciók, számolás, dicséret). Amit nem veszel fel, azt a tablet magyar gépi hangja mondja. |
| 🗣 **Hangbevitel** | „Hogy érzed magad?”, „Hogy ment?”: elég kimondani (*jól ment*, *túl sok volt*, *kevés volt*, *nehéz volt*, *nem sikerült*, *fájt*). Gyakorlat előtt is figyel (*mehet*, *kihagyom*, *várj*). Közben mindig ott vannak a nagy gombok is, bal kézzel kényelmesen nyomhatók. |
| 📈 **Alkalmazkodik** | Ha 2× egymás után jól ment, nő az adag. Ha *túl kevés* volt, +2 lépés. *Túl sok* vagy *nem sikerült*: −2. *Fájt*: −3, és ha egymás után kétszer fájt, a gyakorlat szünetel, te pedig figyelmeztetést kapsz. Ha fáradt, rövidebb az edzés; ha fáj valami, csak kíméletes gyakorlatok jönnek. |
| ⛰ **5 szint** | Alapozás az ágyban → Erősítés az ágyban → Ülés az ágy szélén → Felállás kísérővel → Erős lábon. A következő szint magától nyílik, ha az utolsó edzések jól mentek, és nem fájt semmi. |
| 👨‍👧‍👦 **Unokás motiváció** | A hegy csúcsán az unokák fotói várnak („A cél: felállni és megölelni az unokákat”). A főképernyőn az unokák üzenetei váltakoznak. Minden 3. edzés után kinyílik egy új **unoka-üzenet** fotóval és az unoka hangjával. Az emlékeztetőn az unoka „Hajrá Papa!” felvétele szól. |
| ⭐ **Jutalmak** | Csillagok, napi sorozat (🔥), konfetti, szintlépés-ünneplés. |
| 📊 **Admin** | Napló, hangulat, visszajelzések, figyelmeztetések; adagok, szint és szüneteltetés kézi állítása; export/import; napi automatikus mentés. |

### A gyakorlatok (28 db, Apura szabva)
A fókusz két dolgon van: **a jobb térd kinyújtásán** (combfeszítés, rövid térdnyújtás, térdnyújtó pihenés törölközővel a sarok alatt, ülő térdnyújtás) és **a csípő kiegyenesítésén**, ami a sok fekvés miatt hajlott helyzetben merevedik meg (csonk lenyomás, hason pihenés, csonk emelés hason). Mellettük: erősítés a felüléshez és a felálláshoz (híd, bal kar nyomás, kéztámasz, előredőlés), a jobb váll átmozgatása, keringés (bokapumpa) és légzés. Minden ábra Apu testét mutatja, a két csonkkal együtt.

---

## Telepítés

### 1. A szerver (bármelyik gépen a Tailscale-hálón, pl. a Mac Studión vagy egy NAS-on)
Node 18+ kell hozzá, külső csomag nem.
```bash
cd apu-torna
node server.js              # http://<gép>:8080
# vagy Dockerrel:
docker compose up -d
```
Az adatok a `data/` mappába kerülnek (`state.json`, `audio/`, `backup/`).

### 2. HTTPS Tailscale-en (a mikrofonhoz kell)
A böngésző csak HTTPS-en engedi a hangfelvételt és a beszédfelismerést:
```bash
tailscale serve --bg 8080
```
Ezután az app a `https://<gépnév>.<tailnet>.ts.net/` címen érhető el, az admin a `/admin.html` alatt.

### 3. A tablet
1. Tailscale app → bejelentkezés a ti hálótokba.
2. A legegyszerűbb a **Fully Kiosk Browser** (Android): Start URL: `https://<gépnév>.<tailnet>.ts.net/?auto`
   - *Web Content Settings → Autoplay Videos/Audio*: BE (így a hang a feloldó koppintás nélkül is megy)
   - *Device Management → Keep Screen On*: BE, *Kiosk Mode*: BE, *Launch on Boot*: BE
   - Mikrofon-engedély a böngészőnek: BE
3. Vagy Chrome-ban: menü → *Hozzáadás a kezdőképernyőhöz*, és teljes képernyőn indul.
4. A beszédfelismerés Chrome/Android alatt a Google magyar felismerőjét használja (internet kell hozzá). A gépi hanghoz telepítsd a *Google beszédszolgáltatások* magyar hangcsomagját.

### 4. Első beállítás (a te telefonodról vagy gépedről, az admin oldalon)
1. **Unokák**: név, fotó, üzenet. Vedd fel a „Hajrá Papa!”-t az unokák hangján.
2. **Unoka-üzenetek**: tölts fel 5–10-et előre (szöveg, fotó, hang), és időnként adj hozzá újakat.
3. **Hangfelvételek**: kezdd a *Gyakorlatok leírása*, a *Visszajelzés* és a *Számolás* csoporttal.
4. **Beállítások**: időpontok, megszólítás, tempó (ha gyors a számolás, állítsd 1,3-ra).

Az admin a tabletről is elérhető: a jobb felső fogaskereket kell 1,5 másodpercig nyomva tartani.

---

## Fejlesztés
```bash
npm test     # motor-tesztek
npm start
```
Felépítés: `public/exercises.js` (gyakorlatok és ábra-adatok) · `engine.js` (fejlődés és szintek, a szerver is ezt futtatja) · `phrases.js` (mondatok) · `figures.js` (SVG ábrák) · `voice.js` (hang és beszédfelismerés) · `store.js` (szerver vagy offline tár) · `app.js` (tablet UI) · `admin.js`.
Ha nincs kapcsolat, az app tovább működik, és a kész edzéseket feltölti, amikor visszajön a hálózat.
