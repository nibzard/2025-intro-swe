```mermaid
flowchart TD
    A[Korisnik] -->|Upit / preferencije| B[Chatbot UI]
    B -->|HTTP pozivi| X[Axios]
    X --> C[Backend Server]

    C --> D[Amadeus API]
    C --> E[Geoapify API]
    C --> F[Tavily API]
    C --> G[Groq API]

    D --> C
    E --> C
    F --> C
    G --> C

    C --> H[Supabase]

    C -->|Obrađeni rezultati| B
    B -->|Prikaz rezultata| A
```
