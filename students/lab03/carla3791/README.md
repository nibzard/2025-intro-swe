# Lab 03 – Carla Bajić

Project: BookSeeker
Folder: students/lab03/carla3791/
Status: In Progress
Description: BookSeeker je osobna digitalna knjižnica i inteligentna tražilica knjiga. 
Korisnik može pretraživati knjige prema sjećanju na radnju, likove ili detalje, 
dok aplikacija organizira i prati sve odabrane knjige u privatnoj biblioteci.


## Project Diagram

```mermaid
graph TD
    A[BookSeeker] --> B[User Input (opis knjige)]
    A --> C[AI Search Engine]
    A --> D[Database (baza knjiga)]
    A --> E[Private Library (favorites, wishlist, genres)]
    A --> F[Output (predložene knjige)]