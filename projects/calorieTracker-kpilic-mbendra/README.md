# 🍽️ Calorie Tracker

## 📖 Uvod
U današnje vrijeme mnogi ljudi žele pratiti unos kalorija i makronutrijenata, ali ručno bilježenje često oduzima vrijeme.  
Naš **Calorie Tracker** omogućuje korisniku da jednostavno **uslika svoj obrok**, a aplikacija automatski **prepozna hranu** i izračuna **kalorije i makronutrijente**.

## ❓ Problem
Praćenje prehrane zahtijeva mnogo truda, vremena i točnih informacija o namirnicama.  
Većina postojećih aplikacija zahtijeva ručni unos hrane, što korisnike često demotivira.

## 💡 Hipoteza
Ako korisniku omogućimo da **snimi fotografiju obroka**, te aplikacija automatski prepozna i izračuna nutritivne vrijednosti, tada će:
- praćenje prehrane postati jednostavnije i brže,
- korisnici biti skloniji redovitom korištenju aplikacije,
- točnost unosa biti veća nego kod ručnog unosa.

## 🧠 Metodologija
Projekt koristi **strojno učenje** i **računalni vid** (computer vision) za detekciju hrane.  
Nakon prepoznavanja, koristi se baza podataka (npr. [USDA FoodData Central](https://fdc.nal.usda.gov/)) za dohvat nutritivnih vrijednosti.

## 🖼️ Dijagram rada sustava

flowchart TD
    A[📸 Korisnik uslika obrok] --> B[🤖 AI model prepoznaje hranu]
    B --> C[📊 Baza nutritivnih podataka]
    C --> D[⚙️ Izračun kalorija i makronutrijenata]
    D --> E[📱 Prikaz rezultata korisniku]

⚙️**Tehnologije:**
--Python
--Flask/FastAPI
--React/HTML/CSS
--GitHub

📊**Rezultati:**
Model točno prepoznaje osnovne vrste hrane te procjenjuje kalorije s prihvatljivom pogreškom

🧾 **Zaključak:**
Ovaj projekt pokazuje kako kombinacija računalnog vida i nutricionističkih podataka može pomoći ljudima da jednostavno i točno prate svoj dnevni unos kalorija

👩‍💻 **Autori:**
Katarina Pilić
Marino Bendra

