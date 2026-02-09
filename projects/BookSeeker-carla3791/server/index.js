const express = require("express");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Putanja do JSON "baze" za privatnu biblioteku
const DATA_DIR = path.join(__dirname, "data");
const LIBRARY_FILE = path.join(DATA_DIR, "library.json");

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(LIBRARY_FILE)) {
    fs.writeFileSync(LIBRARY_FILE, JSON.stringify({ books: [] }, null, 2), "utf8");
  }
}

function readLibrary() {
  ensureDataFile();
  const raw = fs.readFileSync(LIBRARY_FILE, "utf8");
  return JSON.parse(raw || '{"books": []}');
}

function writeLibrary(data) {
  ensureDataFile();
  fs.writeFileSync(LIBRARY_FILE, JSON.stringify(data, null, 2), "utf8");
}

// Uklanja HTML tagove iz opisa (Google ponekad vraća HTML)
function stripHtml(html) {
  if (!html || typeof html !== "string") return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Normalizacija knjige u jednostavan objekt
function normalizeBookFromGoogle(item) {
  const info = item.volumeInfo || {};
  const rawDescription = info.description || "";
  return {
    id: item.id,
    title: info.title || "Nepoznat naslov",
    authors: info.authors || [],
    description: stripHtml(rawDescription) || rawDescription,
    categories: info.categories || [],
    thumbnail:
      (info.imageLinks && (info.imageLinks.thumbnail || info.imageLinks.smallThumbnail)) ||
      "",
    infoLink: info.infoLink || "",
    publishedDate: info.publishedDate || "",
    language: info.language || ""
  };
}

// Primjer knjiga kad je Google kvota iscrpljena (429)
const fallbackBooksWhenQuotaExceeded = [
  {
    id: "hp1",
    title: "Harry Potter and the Philosopher's Stone",
    authors: ["J.K. Rowling"],
    categories: ["Fantasy"],
    description: "A young wizard discovers his magical heritage.",
    thumbnail: "",
    infoLink: "https://books.google.com",
  },
  {
    id: "lotr1",
    title: "The Lord of the Rings",
    authors: ["J.R.R. Tolkien"],
    categories: ["Fantasy"],
    description: "Epic journey to destroy the One Ring.",
    thumbnail: "",
    infoLink: "https://books.google.com",
  },
];

// Open Library: dohvat opisa rada (work)
async function fetchOpenLibraryWorkDescription(key) {
  try {
    const url = `https://openlibrary.org${key}.json`;
    const res = await axios.get(url, { timeout: 6000 });
    const desc = res.data?.description;
    if (typeof desc === "string") return desc;
    if (desc && typeof desc.value === "string") return desc.value;
    return "";
  } catch {
    return "";
  }
}

// Normalizacija Open Library knjige u isti format kao Google
function normalizeOpenLibraryBook(doc, description) {
  const workId = (doc.key || "").replace(/^\/works\//, "") || doc.key || "ol-unknown";
  return {
    id: `ol-${workId}`,
    title: doc.title || "Nepoznat naslov",
    authors: Array.isArray(doc.author_name) ? doc.author_name : [],
    description: (description || "").trim(),
    categories: Array.isArray(doc.subject) ? doc.subject.slice(0, 5) : [],
    thumbnail: doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
      : "",
    infoLink: doc.key ? `https://openlibrary.org${doc.key}` : "",
    publishedDate: doc.first_publish_year ? String(doc.first_publish_year) : "",
    language: ""
  };
}

// Pretraga Open Library po opisu/upitu (često duži opisi)
async function searchOpenLibrary(query) {
  try {
    const res = await axios.get("https://openlibrary.org/search.json", {
      params: { q: query, limit: 12 },
      timeout: 10000
    });
    const docs = res.data?.docs || [];
    if (docs.length === 0) return [];

    const toFetch = docs.slice(0, 10).filter((d) => d.key);
    const descriptions = await Promise.all(
      toFetch.map((d) => fetchOpenLibraryWorkDescription(d.key))
    );

    return toFetch.map((doc, i) =>
      normalizeOpenLibraryBook(doc, descriptions[i])
    );
  } catch (err) {
    console.error("Open Library pretraga:", err.message);
    return [];
  }
}

// Spajanje rezultata i uklanjanje očitih duplikata (isti naslov + prvi autor)
function mergeAndDedupeBooks(googleBooks, openLibraryBooks) {
  const seen = new Set();
  const out = [];

  for (const book of [...googleBooks, ...openLibraryBooks]) {
    const title = (book.title || "").toLowerCase().trim();
    const author = (book.authors && book.authors[0]) ? book.authors[0].toLowerCase().trim() : "";
    const key = `${title}|${author}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(book);
  }

  return out;
}

// AI/Internet pretraga knjiga – Google Books + Open Library (po opisu)
app.get("/api/search", async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) {
    return res.status(400).json({ error: "Parametar 'q' (opis knjige) je obavezan." });
  }

  let googleBooks = [];
  let openLibraryBooks = [];
  let quotaExceeded = false;

  try {
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    const url = "https://www.googleapis.com/books/v1/volumes";
    const params = { q, maxResults: 20, printType: "books" };
    if (apiKey) params.key = apiKey;

    const response = await axios.get(url, { params, timeout: 12000 });
    const items = response.data?.items || [];
    googleBooks = items
      .filter((item) => item && item.id)
      .map((item) => normalizeBookFromGoogle(item));
  } catch (err) {
    const status = err.response?.status;
    const msg = err.response?.data?.error?.message || err.message;
    console.error("Google Books pretraga:", msg);

    if (status === 400 || status === 403) {
      return res.status(400).json({
        error: "Google Books API: ključ nije valjan ili nema dopuštenja. Provjeri GOOGLE_BOOKS_API_KEY u server/.env",
        details: msg
      });
    }
    if (status === 429) {
      quotaExceeded = true;
      googleBooks = [];
    } else {
      googleBooks = [];
    }
  }

  try {
    openLibraryBooks = await searchOpenLibrary(q);
  } catch {
    openLibraryBooks = [];
  }

  const books = mergeAndDedupeBooks(googleBooks, openLibraryBooks);

  if (quotaExceeded && books.length === 0) {
    return res.json({
      books: fallbackBooksWhenQuotaExceeded,
      message: "Dnevni limit Google pretrage je iscrpljen. Prikazujem primjer knjiga. Sutra opet možeš pretraživati prave rezultate."
    });
  }

  if (quotaExceeded && books.length > 0) {
    return res.json({
      query: q,
      count: books.length,
      books,
      message: "Dnevni limit Google Books je iscrpljen; prikazani su i rezultati s Open Library. Sutra će opet raditi puna pretraga."
    });
  }

  res.json({ query: q, count: books.length, books });
});

// Dohvat svih spremljenih knjiga iz privatne biblioteke, uz opcionalno filtriranje
app.get("/api/library", (req, res) => {
  const { genre, author, search } = req.query;
  const data = readLibrary();
  let books = data.books || [];

  if (genre) {
    const g = genre.toLowerCase();
    books = books.filter(
      (b) => (b.categories || []).some((c) => c.toLowerCase().includes(g))
    );
  }

  if (author) {
    const a = author.toLowerCase();
    books = books.filter((b) =>
      (b.authors || []).some((name) => name.toLowerCase().includes(a))
    );
  }

  if (search) {
    const s = search.toLowerCase();
    books = books.filter(
      (b) =>
        (b.title && b.title.toLowerCase().includes(s)) ||
        (b.description && b.description.toLowerCase().includes(s))
    );
  }

  res.json({ count: books.length, books });
});

// Spremanje knjige u privatnu biblioteku
app.post("/api/library", (req, res) => {
  const book = req.body;
  if (!book || !book.id) {
    return res.status(400).json({ error: "Knjiga mora imati polje 'id'." });
  }

  const data = readLibrary();
  const exists = data.books.find((b) => b.id === book.id);
  if (exists) {
    return res.status(200).json({ message: "Knjiga je već u biblioteci.", book: exists });
  }

  const normalized = {
    id: book.id,
    title: book.title || "Nepoznat naslov",
    authors: book.authors || [],
    description: book.description || "",
    categories: book.categories || [],
    thumbnail: book.thumbnail || "",
    infoLink: book.infoLink || "",
    publishedDate: book.publishedDate || "",
    language: book.language || ""
  };

  data.books.push(normalized);
  writeLibrary(data);

  res.status(201).json({ message: "Knjiga spremljena u biblioteku.", book: normalized });
});

// Brisanje knjige iz biblioteke
app.delete("/api/library/:id", (req, res) => {
  const { id } = req.params;
  const data = readLibrary();
  const before = data.books.length;
  data.books = data.books.filter((b) => b.id !== id);
  const after = data.books.length;

  if (after === before) {
    return res.status(404).json({ error: "Knjiga nije pronađena u biblioteci." });
  }

  writeLibrary(data);
  res.json({ message: "Knjiga obrisana iz biblioteke." });
});

app.get("/", (req, res) => {
  res.json({ status: "BookSeeker backend radi", docs: "/api/search, /api/library" });
});

app.listen(PORT, () => {
  ensureDataFile();
  console.log(`BookSeeker backend sluša na http://localhost:${PORT}`);
});

