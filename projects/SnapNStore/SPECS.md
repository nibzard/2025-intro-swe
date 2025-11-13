## Uvod
Sve više ljudi u današnje vrijeme prikuplja račune radi osobnih troškova ili garancija. Ručno spremanje i upisivanje podataka je dug i u nekim slučajevima podložan pogreškama. Potreba za jednostavnosti se javlja u obliku aplikacije koja automatski prepoznaje i pohranjuje informacije s računa bez potrebe za ručnim unosom.


## Predstavljanje problema
Korisnici svakodnevno skupljaju račune u papirnatom obliku koji se lako izgube ili oštete. Čak i ako se računi skeniraju ili slikaju, podaci nisu lako pretraživi jer su spremljeni samo kao slike.
Problem je neefikasno i netočno upravljanje računima koje dovodi do gubitka informacija i otežava praćenje troškova.

Aplikacija koju razvijamo ima za cilj riješiti ovaj problem automatskim prepoznavanjem ključnih podataka i njihovim spremanjem u digitalnu bazu.


## Hipoteza
Ako korisniku omogućimo da putem jednostavne aplikacije uslika račun, a sustav automatski prepozna ključne podatke pomoću OCR (Optical Character Recognition) tehnologije, tada će:
        - **proces pohrane računa postati brži i precizniji**
        - **korisnik imati bolju kontrolu nad troškovima**
        - **i potreba za ručnim unosom biti potpuno uklonjena**


## Cilj projekta
Cilj projekta je razviti jednostavnu aplikaciju:
        1. **Učitavanje ili fotografiranje računa**
        2. **Prepoznavanje sadržaja pomoću OCR-a**
        3. **Izdvajanje važnih informacija (datum, iznos, trgovina)**
        4. **Spremanje podataka u CSV datoteku radi lakšeg pregleda i analize**
        5. **Testiranje funkcionalnosti pomoću Behavior Driven Development (BDD) pristupa**


## Zaključak
Projekt pokazuje kako se uz minimalnu količinu koda i pomoću postojećih alata može izraditi jednostavna, ali funkcionalna aplikacija koja rješava stvarni problem.
Primjena OCR-a i BDD testiranja omogućuje:
      - **automatizaciju obrade računa**
      - **provjeru točnosti kroz testove**
      - **jasnu dokumentaciju razvoja**

Cilj nije stvoriti komercijalni proizvod, već demonstrirati praktičnu primjenu tehnologija u stvarnom kontekstu.