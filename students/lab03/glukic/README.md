## 📊 Aplikacija za prepoznavanje računa (BDD dijagram)

```mermaid
graph TD
    A[👤 Korisnik otvara aplikaciju] --> B[📸 Odabir / slikanje računa]
    B --> C[🧠 OCRService.cs prepoznaje tekst pomoću Tesseract-a]
    C --> D[🔍 Regex traži datum, iznos i naziv trgovine]
    D --> E[📦 DataService.cs sprema podatke u receipts.csv]
    E --> F[💾 Podaci spremljeni uspješno]

    %% BDD testovi
    G[🧩 SpecFlow: UploadReceipt.feature] --> H[✅ UploadReceiptSteps.cs]
    H --> I[Given imam račun 'sample_receipt.jpg']
    H --> J[When procesiram račun]
    H --> K[Then podaci su prepoznati i spremljeni]

    %% Poveznice
    F -. provjera uspjeha .-> H

    style A fill:#1E90FF,color:#fff,stroke:#000,stroke-width:2px
    style C fill:#6A0DAD,color:#fff,stroke:#000,stroke-width:2px
    style E fill:#228B22,color:#fff,stroke:#000,stroke-width:2px
    style G fill:#FF8C00,color:#fff,stroke:#000,stroke-width:2px
'''