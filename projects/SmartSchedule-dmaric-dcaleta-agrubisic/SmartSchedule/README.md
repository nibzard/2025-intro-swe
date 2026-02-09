# SmartSchedule

Web aplikacija za izradu i optimizaciju radnih rasporeda uz pomoć AI.

## Tehnologije
- HTML, CSS (dark theme)
- JavaScript (vanilla, bez frameworka)
- LocalStorage (nema backend)

## Uloge
- **Poslodavac**: kreira tvrtku, dodaje radnike, definira pravila, pokreće AI, objavljuje raspored
- **Radnik**: unosi dostupnost, pregledava svoj raspored

## Pokretanje
1. Otvorite `index.html` u pregledniku
2. Registrirajte korisnika (radnik ili poslodavac)
3. Slijedite upute na ekranu

## Pravila rasporeda
- Tjedni limit: 48 sati po radniku
- Smjene: Jutarnja (7h), Popodnevna (7h), Međusmjena (4h), Slobodno (0h)
- Objekt uvijek mora imati radnika
- AI generira optimalan raspored

## Struktura
- index.html, dashboard.html, business-create.html, business-final.html, personal.html
- css/global.css
- js/auth.js, navigation.js, schedules.js, personal.js, utils.js
