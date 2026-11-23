# Fancynails, decemberi 1. hírlevél (2026-12-02, kedd 10:00)

**Fájl:** `01-december-keszletfeltoltes.html` (UNAS: Marketing › Hírlevél › új sablon, **„Szöveg mód”**, a teljes HTML bemásolva).
**Alap:** a 04 „Szalonoknak” sablon (UNAS 452866), amit Zoli 10-19-én jóváhagyott. A forrás változatlan másolata itt van: `_forras-04-szalonoknak.html`.

## Mi változott a 04-hez képest

| Elem | 04 (október) | December |
| --- | --- | --- |
| Cím (`<title>`, H1) | Ami a szalonban mindig fogy | Decemberben ez fogy el először |
| Előnézet-szöveg | Készletlista a szalonba, … | Készletlista az ünnepek előtti hetekre: köpeny, törölköző, literes oxidáló és egy tipp kozmetikusoknak. |
| Nyitó bekezdés | Telt ház, a következő vendég… | Az ünnepek előtt mindenki egyszerre akar festetni és vágatni… |
| Készletlista címe | Ezeket érdemes mindig raktáron tartani | Ezeket töltsd fel a decemberi hetek előtt |
| UTM | `utm_campaign=szalonoknak` | `utm_campaign=2026-12-keszletfeltoltes` (14 link) |

A termékek, képek, árak (ár nincs a levélben), a lábléc és a `[link_unsubscribe]` nem változtak.

## Tárgysor (az első a javasolt)

1. Decemberben ez fogy el először
2. Telt ház decemberben? Előtte nézd át ezt a listát
3. Mielőtt jön a decemberi csúcs

## Kiküldés előtt (12-01, hétfő, a Macen)

- [ ] Mind a 14 link él (200), és a 6 termék készlete ≥ 22 db (UNAS API). A felhős session nem éri el a fancynails.hu-t, ezért ezt itt nem tudtam ellenőrizni.
- [ ] A képek az UNAS fájlkezelőből töltődnek (`shop.unas.hu/shop_ordered/26106/pic/hirlevel/…`).
- [ ] Tesztlevél Lacinak, mobilon és asztali gépen megnézve.
- [ ] Zoli nem jelzett problémát a péntekig tartó határidőig.
- [ ] Célközönség: feliratkozottak (283 megerősített, 11-20). Feladó: Fancynails / info@fancynails.hu.

## Szövegíró-kapu

Erre a változatra a lint még nem futott (a `copy_lint.py` és a `check_copy.py` a Macen van). Önellenőrzés: nincs mondatközi gondolatjel (az egy `20–25 perc` számtartomány), tegező, kedvezményt nem ígér, ár nincs, felkiáltójel nincs. Kiküldés előtt futtasd le a kaput.
