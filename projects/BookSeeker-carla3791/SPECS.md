# SPECS.md — BookSeeker (tehnička specifikacija)

## 1. Sažetak
Ovaj dokument opisuje tehničku izvedbu BookSeeker MVP-a: backend servis koji omogućuje semantičko pretraživanje knjiga na temelju opisa korisnika. Cilj je imati reproducibilan lokalni setup s modelom za embeddings i lokalnim vektor-storeom (FAISS).

---

## 2. Arhitektura (kratko)
Komponente:
- **Client (UI / CLI / curl)** — šalje tekstualni upit.
- **FastAPI backend** — prima upit na endpoint `/search`, orchestrira embedding i upit u vektor-store.
- **Embeddings module** — koristi `sentence-transformers` (npr. `all-MiniLM-L6-v2`) za generiranje vektora.
- **FAISS index** — lokalni vektor-store za brzo pretraživanje najbližih vektora.
- **Data store (JSON)** — jednostavan katalog knjiga (može se zamijeniti DB-om kasnije).
- **BDD testovi (behave)** — validacija funkcionalnosti iz korisničke perspektive.

---

## 3. Endpoints (API specifikacija)

### POST /search
- **Opis:** Traži knjige prema tekstualnom opisu.
- **URL:** `/search`
- **Body (JSON):**
```json
{
  "q": "tekst upita (opis knjige)",
  "k": 3
}
