(24.11.2025)(Karlo)
	-napravio baznu stranicu za mobitel
	-radio u React-native (sa TypeScript)
	-Kako nebi morao koristiti Android Studio, koristio sam Expo za pokretanje aplikacije
	-Da bi se apliakcija mogla pogledati na mobu, treba instalirati ExpoGo na mobitel 
	-Kako bi se tesitirala, kad se aplikacija pokrene u terminalu, dobice se QRkod, 
	 i njega se skenira za pokrenit aplikacij una mobu (automatski se pokrene i na IOSu)
	-ako bi se htjelo raditi na njoj, trebace mozda instalirati neke dependancy
	
**Instalacija**
-kad otvorite apk u VS Code-u, u terminal samo upišite ovo:
	'npm install' i on bi vam automatski trebao isntalirat sve
-projekt pokrećete tako da u terminal upišete 
	'npx expo start' (treba malo sačekat ali se pokrene)
-na mobitel instalirajte aplikaciju Expo Go
-na terminal bi trebali dobiti QR code, koji skenirate sa aplikacijom Expo Go
- ako je sve prošlo u redu na mobitelu bi vam se trebalo pokazat 
ono šta ste radili u aplikaciji
-apk na mobu se automatski ažurira kada promjenite kod, ne trebate izlazit iz pokrenutog 
 simulatora na terminalu

NAPOMENA: da bi vam radilo, vaš laptop/PC i mob sa kojim ste skenirali apk, 
 moraju biti na istoj WIFI mreži

(28.11.2025)(Karlo)
	-Tribalo bi izbaciti footer u aplikaciji, jer nam ne triba realno, 
	 jer sve funkcionalnosti imamo u ovim kvadratima. tako da nam je navigation footer nepotreban
	-Maknut footer, kvadrat i pravokutnik na HomePage-u prebacen u novi component

(2.12.2025.)(Lucija)
	-Polušaj implementacije Vercela za hostanje umjesto Expo-a
**(Reply)(Karlo)
	-Expo nije program za hostanje, nego za development mobilnih aplikacija (Android/IOS) uz pomoć React-Native-a. 
	Tako da zamjena baš nema smisla. Ja sam generalno za da koristimo Vercel za server kasnije. Prestat
	upotrebljavat Expo mi ima smisla jedino ako ćemo ispočetka počet raditi samo web aplikaciju, onda 
	nam on ne triba.
	-Možda preporuka da koristimo Firebase, jer Vercel nije baš pogodan za mobile.
**(Reply)(Lucija)
	-Pokušala sam koristiti Firebase, nije se pokazao najoptimalnijim
	-Uspjela sam hostati s Vercelom
