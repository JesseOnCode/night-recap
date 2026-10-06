# Suomalaiset NHL:ssä — suunnitelma

Yhden sivun Next.js-sovellus. Se näyttää viime yönä pelanneet suomalaiset, heidän tilastonsa ja suomalaisten maalit upotettuina videoina. Sivu julkaistaan Polar55-webhotelliin ja linkitetään portfolion etusivulta.

## Kenelle sivu on

Suomalainen katsoja aamulla. Yhdellä avauksella selviää, ketkä suomalaiset pelasivat päättyneellä NHL-kierroksella, mitä tilastoja heille kertyi ja miltä maalit näyttävät.

## Mitä sivulla on

Ylhäällä otsikko **Viime yö** ja NHL-kierroksen päivä Suomen ajassa.

Heti otsikon alla taulukko. Siinä ovat kaikki suomalaiset, jotka pelasivat kierroksella, myös ilman tehopisteitä. Mukana ovat kenttäpelaajat ja maalivahdit. Pelannut on boxscoressa oleva pelaaja, jonka jääaika on yli `00:00`.

Rivin järjestys: pisteet laskevasti, samalla pistemäärällä maalit laskevasti, sen jälkeen sukunimi. Maalivahdin pisteet ovat 0, joten hän asettuu samalla säännöllä niiden joukkoon, joille ei kertynyt tehopisteitä.

Taulukon sarakkeet, tässä järjestyksessä:

| Sarake | Lähde boxscoressa | Esimerkki |
| --- | --- | --- |
| Pelaaja | nimi ja seura | Roope Hintz, DAL |
| Ottelu | oma joukkue, vastustaja, tulos | DAL–SJS 5–0 |
| M | `goals` | 0 |
| S | `assists` | 2 |
| P | `points` | 2 |
| +/− | `plusMinus` | +3 |
| RM | `pim` | 0 |
| Lauk | `sog` | 1 |
| Takl | `hits` | 1 |
| Blok | `blockedShots` | 0 |
| JA | `toi` | 15:31 |
| Vaih | `shifts` | 19 |
| Men | `giveaways` | 0 |
| Riis | `takeaways` | 0 |
| YV | `powerPlayGoals` | 0 |
| Al% | `faceoffWinningPctg` | 72,7 |
| Torj | `saves` | 21 |
| Torj% | `savePctg` | 80,8 |
| Pääst | `goalsAgainst` | 5 |
| Ratk | `decision` | L |

Kenttäpelaajan rivillä torjunnat, torjuntaprosentti, päästetyt ja ratkaisu ovat viivoja. Maalivahdin rivillä maalit, syötöt, pisteet, plus-miinus, laukaukset, taklaukset, blokatut, vaihdot, menetykset, riistot, ylivoimamaalit ja aloitukset ovat viivoja. Jääaika ja rangaistusminuutit täytetään kummallekin.

Aloitusprosentti ja torjuntaprosentti näytetään yhdellä desimaalilla ja pilkulla (`72,7`, `80,8`). Jos aloitusprosentti on `0`, solussa on viiva, koska boxscore ei kerro aloitusten määrää. Torjuntaprosentti `1` näytetään `100,0`. Ratkaisu on `W`, `L` tai `O`, kun boxscore sen antaa.

Taulukon alla on **Maalit**, aikajärjestyksessä. Kortti tehdään suomalaisen tekemästä maalista. Kortissa on nimi, seura, erä, aika, syöttäjät ja 16:9-video. Kun `highlightClip` on mukana, soitin täyttää videopaikan. Sitä ennen kortissa on maalin teksti.

Syöttö ilman omaa maalia näkyy taulukkorivinä.

## Teknologiat

| Osa | Valinta |
| --- | --- |
| Kieli | TypeScript |
| Sovellus | Next.js (App Router) |
| Ajonaikainen ympäristö | Node.js 20 |
| Testit | Vitest, puhtaille funktioille |
| Laatu | ESLint |
| Julkaisu | Polar55, cPanelin Node.js-sovellus |
| Osoite | `https://jessehaapaniemi.com/projektit/suomalaiset-nhl` |

Portfolion etusivu jää nykyiseksi HTML-sivuksi. Tämä sovellus on oma Node.js-sovellus samalla tilillä. Etusivun projektikorttiin tulevat live-demo ja GitHub-linkki. Tuore tila haetaan NHL:ltä jokaisella pyynnöllä.

## Miksi haku tehdään palvelimella

Next.js-reitti hakee NHL:n palvelimella ja palauttaa sivulle oman JSON-vastauksen. Selain kysyy suhteellista osoitetta `api/night`. NHL:n vastauksessa ei ole otsaketta, joka sallisi haun suoraan selaimesta.

Suhteellinen osoite on pakollinen. Julkaisu on alipolussa `/projektit/suomalaiset-nhl`. Osoite `/api/night` menisi domainin juureen ja ohi tämän sovelluksen. Next.js-asetukseen laitetaan `basePath`.

## Kansiorakenne

```
suomalaiset-nhl/
├── app/
│   ├── layout.tsx          sivun kuori ja otsikko
│   ├── page.tsx            taulukko ja maalikortit
│   ├── globals.css
│   └── api/
│       └── night/
│           └── route.ts    GET, palauttaa yhden yön
├── src/
│   └── nhl/
│       ├── types.ts        vastauksen ja NHL:n kenttien tyypit
│       ├── slate.ts        kierroksen valinta
│       ├── finns.ts        syntymämaa ja pelanneet
│       ├── stats.ts        taulukon rivit ja Al%-muotoilu
│       └── goals.ts        suomalaiset maalit ja videon osoite
├── tests/
│   ├── slate.test.ts
│   ├── finns.test.ts
│   └── stats.test.ts
├── .gitignore
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── README.md
└── SUUNNITELMA.md
```

`app/` on se, mitä Next.js näyttää ja palvelee. `src/nhl/` sisältää kierroksen, suodatuksen ja tilastojen logiikan. Testit kohdistuvat siihen. `route.ts` hakee NHL:n ja kutsuu näitä funktioita.

## Rajapinnat

Kaikki kutsut ovat GET-pyyntöjä.

| Tarkoitus | Osoite |
| --- | --- |
| Kuluvan kierroksen ottelut | `https://api-web.nhle.com/v1/score/now` |
| Tietyn päivän ottelut | `https://api-web.nhle.com/v1/score/YYYY-MM-DD` |
| Pelaajatilastot | `https://api-web.nhle.com/v1/gamecenter/{gameId}/boxscore` |
| Seuran rosteri | `https://api-web.nhle.com/v1/roster/{lyhenne}/current` |

`score/now` ohjaa sen NHL-päivän pakettiin, jota liiga pitää kuluvana. Valmiin ottelun `gameState` on `OFF`. Aloittamattoman ottelun tila on `FUT`. Käynnissä olevan ottelun tila on `LIVE` tai `CRIT`.

Rosterissa suomalainen on pelaaja, jonka `birthCountry` on `FIN`. Haetaan niiden seurojen rosterit, jotka pelaavat tällä kierroksella.

Boxscoren kenttäpelaajan tilastot luetaan ryhmistä `forwards` ja `defense`. Maalivahdit luetaan ryhmästä `goalies` samalla pistesäännöllä.

## Yhden yön valinta

Sivu näyttää aina tasan yhden NHL-kierroksen.

1. Haetaan `score/now`.
2. Jos sillä päivällä on ottelu, joka on käynnissä tai päättynyt, käytetään sitä päivää.
3. Jos kaikki ottelut ovat vielä `FUT`, käytetään vastauksen `prevDate`-päivää. Silloin ruudulla pysyy viimeksi pelattu yö, eikä tyhjä tuleva otteluohjelma.

Peräkkäiset kierrokset eivät ole käynnissä yhtä aikaa. Arkikierros päättyy Suomessa aamulla, ja seuraava alkaa seuraavana yönä aikaisintaan noin kello 2. Saman kierroksen ottelut pelataan limittäin kello 2:n ja 8:n välillä. Ne kuuluvat samaan taulukkoon.

Päivämäärä näytetään aikavyöhykkeellä `Europe/Helsinki`. Ottelun NHL-päivä ja Suomen kalenteripäivä eivät ole sama asia: illan itärannikon ottelu on Suomessa jo seuraavan vuorokauden puolella.

## Päivitys

`route.ts` hakee tuoreen tilanteen joka kutsulla. Selain kutsuu `api/night`-osoitetta:

- 60 sekunnin välein, jos kierroksella on ottelu joka ei ole päättynyt
- 10 minuutin välein, kun kaikki ottelut ovat päättyneet

Jälkimmäinen pitää yön ruudulla ja vaihtaa kierroksen, jos välilehti jää auki seuraavaan yöhön. Tilastot päivittyvät kymmenien sekuntien viiveellä siitä, kun NHL kirjaa tapahtuman. Suomalainen ilmestyy taulukkoon, kun hänelle kirjataan jääaikaa. Maalivideo ilmestyy, kun maalirivillä on `highlightClip`. Se tulee yleensä muutaman minuutin kuluttua maalista.

Jos NHL-haku epäonnistuu, reitti palauttaa HTTP 502:n ja suomenkielisen virheilmoituksen. Sivu pitää edellisen onnistuneen taulukon näkyvissä ja näyttää ilmoituksen.

## Video

Jokaisella maalilla tulospaketissa on `highlightClip`, kun NHL on julkaissut klipin. Soittimen osoite kootaan siitä:

```
https://players.brightcove.net/6415718365001/default_default/index.html?videoId={highlightClip}
```

Se laitetaan iframen `src`-attribuuttiin. Iframessa on `allow="encrypted-media; fullscreen"` ja `allowfullscreen`.

Tekstissä oleva linkki osoittaa suomenkieliselle NHL-sivulle `highlightClipSharingUrl`-osoitteella, polkuun lisättynä `/fi`, kun jako-osoite on englanninkielinen `nhl.com/video/...`.

## Oman rajapinnan vastaus

`GET api/night` palauttaa sivun piirtämät rivit.

```json
{
  "slateDate": "2026-10-05",
  "updatedAt": "2026-10-06T06:10:00.000Z",
  "gamesInProgress": false,
  "players": [],
  "goals": []
}
```

`players`-rivillä on taulukon sarakkeet valmiiksi muotoiltuina sekä `playerId`. `goals`-rivillä on `playerId`, nimi, seura, erä, aika, syöttäjien nimet, ottelun tilanne maalin jälkeen ja `videoId` tai `null`.

## Testattavat päätökset

Testit käyttävät tallennettua esimerkkiä.

- Kierros, jonka ottelut ovat `FUT`, vaihtuu edelliseen päivään.
- Kierros, jossa yksikin ottelu on `LIVE` tai `OFF`, pysyy sillä päivällä.
- Taulukkoon pääsee suomalainen, jonka jääaika on yli `00:00`, myös ilman tehopisteitä.
- Maalivahti, jonka jääaika on yli `00:00`, on taulukossa. Torjunnat, torjuntaprosentti, päästetyt ja ratkaisu tulevat hänen rivilleen.
- Syöttö ilman omaa maalia tuottaa taulukkorivin.
- Kaksi maalia samalta pelaajalta tekee kaksi videokorttia ja yhden taulukkorivin.
- Aloitusprosentti `0,727273` muotoillaan `72,7`. Arvo `0` muotoillaan viivaksi.
- `highlightClip` puuttuessa `videoId` on `null`.

## GitHub

Repositorio on julkinen: `JesseOnCode/suomalaiset-nhl`.

`.gitignore` kattaa kansiot `node_modules` ja `.next` sekä tiedoston `.env*`.

`README.md` sisältää tässä järjestyksessä:

1. Yhden kappaleen kuvaus.
2. Kuvakaappaus taulukosta ja yhdestä maalikortista.
3. Julkaistu osoite ja linkki portfolion etusivulle.
4. Teknologiat kolmella rivillä.
5. Käynnistys: `npm install` ja `npm run dev`.
6. Mistä data tulee: kolme NHL-osoitetta ja videon kokoamissääntö.
7. Kierroksen valinta ja se, miksi haku tehdään palvelimella.

## Julkaisu Polar55:een

cPanelissa luodaan Node.js-sovellus.

- Sovelluksen juuri on tämä projekti.
- Application URL on `/projektit/suomalaiset-nhl`.
- Käynnistyskomento on Next.jsin tuotantoversio, ja portti luetaan ympäristömuuttujasta `PORT`.
- `basePath` on sama polku kuin Application URL.

Ennen ensimmäistä julkaisua tarkistetaan Polar55:ltä:

- Node.js-versioksi voi valita 20:n.
- Application URL toimii alipolussa, ja portfolion etusivu jää juureen.
- Sovellus näkee pyynnön polun joko koko polkuna tai ilman alipolun etuliitettä. `basePath` asetetaan sen mukaan, kumpi toteutuu.

Asiakaspalvelu: asiakaspalvelu@polar55.fi

## Rakennusjärjestys

Jokainen kohta commitoitaan erikseen, kun se toimii omalla koneella.

1. Next.js-projekti, TypeScript, ESLint, Vitest ja `.gitignore`. Sivu näyttää otsikon Viime yö.
2. Tyypit ja `slate.ts` testeineen. Kierros valitaan paikallisella esimerkkidatalla.
3. `finns.ts` ja `stats.ts` testeineen. Taulukkorivit syntyvät esimerkkirosterista ja boxscoresta.
4. `goals.ts` testeineen. Videokortit ja soitinosoite syntyvät esimerkkimaaleista.
5. `route.ts` kutsuu NHL:ää ja palauttaa sovitun JSON-muodon. Virhe palauttaa 502:n.
6. `page.tsx` piirtää taulukon ja maalit. Päivitysväli riippuu kentästä `gamesInProgress`.
7. Ulkoasu: taulukko ylhäällä, maalit sen alla, sivu toimii kapealla näytöllä.
8. `README.md` kuvakaappauksella ja käynnistysohjeella.
9. Julkaisu Polar55:een ja linkki portfolion projektikortista.
