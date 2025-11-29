## 🏗️ Arhitektura
Aplikacija se sastoji od tri glavne komponente:
1. **Frontend** – korisničko sučelje za upload slike i prikaz rezultata.
2. **Backend API** – prima sliku, komunicira s AI modelom i bazom podataka.
3. **ML Model** – koristi se za klasifikaciju slika i prepoznavanje vrste hrane.


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

## 🧠 Model
- CNN (Convolutional Neural Network)
- Trenirano na datasetu npr. *Food-101*
- Ulaz: slika hrane (JPEG/PNG)
- Izlaz: oznaka hrane + vjerojatnost

## 🚀 Budući planovi
- Dodavanje mogućnosti prepoznavanja više jela na jednoj slici  
- Personalizirane preporuke dnevnog unosa  
- Mobilna verzija aplikacije  

