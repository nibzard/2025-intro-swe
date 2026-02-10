# 🍽️ Calorie Tracker

## 📖 Uvod
U današnje vrijeme mnogi ljudi žele pratiti unos kalorija i makronutrijenata, ali ručno bilježenje često oduzima vrijeme.  
Naš **Calorie Tracker** omogućuje korisniku da jednostavno **uslika svoj obrok**, a aplikacija automatski **prepozna hranu** i izračuna **kalorije i makronutrijente**.

## ❓ Problem
Praćenje prehrane zahtijeva mnogo truda, vremena i točnih informacija o namirnicama.  
Većina postojećih aplikacija zahtijeva ručni unos hrane, što korisnike često demotivira.

## 🧩 Funkcionalnosti
- Upload slike obroka  
- Automatska klasifikacija hrane  
- Dohvat nutritivnih vrijednosti iz baze  
- Izračun kalorija i makronutrijenata  
- Vizualni prikaz rezultata korisniku  


## 🔍 API rute (primjer)
| Metoda | Ruta | Opis |
|--------|------|------|
| `POST` | `/analyze` | Prima sliku i vraća nutritivne podatke |
| `GET`  | `/food/{name}` | Dohvaća nutritivne vrijednosti po nazivu |

📊**Rezultati:**
Model točno prepoznaje osnovne vrste hrane te procjenjuje kalorije s prihvatljivom pogreškom

🧾 **Zaključak:**
Ovaj projekt pokazuje kako kombinacija računalnog vida i nutricionističkih podataka može pomoći ljudima da jednostavno i točno prate svoj dnevni unos kalorija

