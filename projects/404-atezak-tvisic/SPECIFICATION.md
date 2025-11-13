```mermaid
flowchart TD
    A[Početni ekran] --> C{Odabir svijeta}
    C -->|Planet brojeva| D[Mini igre: Brojanje, Zbrajanje, Uspoređivanje]
    C -->|Zemlja misli| E[Mini igre: Pamćenje, Prepoznavanje uzorka]
    D --> F[Ekran s pohvalama i bodovima]
    E --> F
    F --> G{Povratak}
    G -->|Ista kategorija| C1[Vrati u Planet brojeva ili Zemlju misli]
    G -->|Odabir svijeta| C
    G -->|Početni ekran| A
