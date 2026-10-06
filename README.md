# Night Recap

Night Recap kokoaa yhdelle sivulle NHL:ssä viime yönä pelanneet suomalaiset. Sivulla ovat pelaajien ottelutilastot, maalien ja syöttöjen videot, lopputulokset, kauden tilastot ja suomenkieliset uutiset.

## Sivut

**Viime yö** näyttää kierroksen, jonka NHL:n rajapinta ilmoittaa viimeisimmäksi. Mukana ovat kaikki suomalaiset, joilla on jääaikaa, myös ilman pisteitä. Kenttäpelaajat ja maalivahdit ovat omissa taulukoissaan. Pelaajan nimeä painamalla aukeavat hänen maaliensa ja syöttöjensä videot. Oikealla ovat niiden otteluiden lopputulokset, joissa suomalaisia pelasi. Kun otteluita on käynnissä, sivu päivittyy 20 sekunnin välein.

**Uutiset** listaa NHL.comin suomenkieliset jutut, joissa suomalaispelaaja on mainittu. Uusimmat otsikot kiertävät myös jokaisen sivun yläreunassa.

**Tilastot** näyttää suomalaisten kauden luvut kenttäpelaajille ja maalivahdeille.

Taulukot voi järjestää mistä tahansa sarakkeesta painamalla otsikkoa. Lyhenteiden selitykset ovat taulukon alla.

Kapealla näytöllä taulukot muuttuvat korteiksi. Jokaisen numeron yläpuolella on sen lyhenne, ja järjestäminen on napurivinä taulukon yläpuolella.

## Tekniikka

- Next.js 16 (App Router), React 19 ja TypeScript
- Vitest yksikkötesteihin
- ESLint

Tiedot tulevat NHL:n julkisesta rajapinnasta `api-web.nhle.com`. Uutiset haetaan NHL:n sisältörajapinnasta suomenkielisinä.

NHL:n rajapinta ei salli hakuja suoraan selaimesta, joten haut tehdään palvelimella. Sivu kysyy omalta reitiltään `api/night`, ja palvelin kokoaa vastauksen NHL:n tulospalvelusta, sarjataulukosta, kokoonpanoista ja otteluiden boxscoreista. Suomalaiset tunnistetaan kokoonpanon syntymämaasta.

Palvelin pitää tuloksia välimuistissa, jotta NHL:ää ei kuormiteta jokaisella sivunlatauksella. Päättyneen kierroksen tiedot säilyvät, kunnes uusi kierros alkaa. Käynnissä olevan kierroksen tiedot haetaan uudelleen 20 sekunnin välein. Jos haku epäonnistuu tai NHL palauttaa liikaa pyyntöjä, haku yritetään uudelleen lyhyen tauon jälkeen.

Sivu julkaistaan alipolussa `/projektit/night-recap`. Polku on Next.jsin `basePath`, joten sama osoite toimii paikallisesti ja Polar55:ssä. Selaimen haut `api/night` ja `api/logo` käyttävät tätä polkua.

Videolinkki, uutislinkki ja uutiskuva hyväksytään vain, jos osoite on HTTPS ja palvelin on NHL:n (`nhl.com`, `www.nhl.com` tai `media.d3.nhle.com`). Muu osoite jätetään näyttämättä. Logoksi kelpaa vain SVG, jossa ei ole skriptiä. Vastauksiin lisätään otsikot `X-Content-Type-Options`, `X-Frame-Options` ja `Referrer-Policy`.

## Käynnistys

Tarvitset Node.js 20:n tai uudemman.

```bash
npm install
npm run dev
```

Sivu aukeaa osoitteeseen http://localhost:3000/projektit/night-recap.

Tuotantoversio:

```bash
npm run build
npm start
```

## Testit

```bash
npm test
```

Testit käyttävät tallennettua esimerkkidataa, eivätkä ne tee hakuja NHL:ään. Ne kattavat kierroksen valinnan, suomalaisten tunnistamisen, taulukkorivien muotoilun, maalien ja syöttöjen videot, välimuistin, kauden tilastot, uutisten suodatuksen, logojen rajauksen, taulukon järjestämisen ja sen, että NHL:n ulkopuoliset osoitteet hylätään.

## Rakenne

```
app/
  page.tsx            Viime yö
  night-board.tsx     yön taulukot, videot ja lopputulokset
  tilastot/           kauden tilastot
  uutiset/            uutiset
  api/night/          yön tiedot sivulle
  api/logo/           joukkueiden logot
next.config.ts        julkaisupolku ja turvaotsikot
src/
  base-path.ts        polku /projektit/night-recap
  nhl/
    client.ts         NHL-haut, uudelleenyritys ja välimuisti
    load-night.ts     yön koosteen kokoaminen
    slate.ts          näytettävän kierroksen valinta
    finns.ts          pelanneiden suomalaisten tunnistus
    stats.ts          taulukkorivit
    goals.ts          maalien ja syöttöjen videot
    load-season.ts    kauden tilastot
    load-news.ts      uutiset
    sort-table.ts     taulukon järjestäminen
tests/                yksikkötestit
```

## Huomio

Projekti ei ole NHL:n virallinen palvelu. Tiedot, videot ja logot ovat NHL:n.
