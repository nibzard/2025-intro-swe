import React, { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "";

function stripHtml(text) {
  if (!text || typeof text !== "string") return "";
  return text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function BookDescriptionModal({ book, onClose }) {
  useEffect(() => {
    if (!book) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [book, onClose]);

  if (!book) return null;
  const description = stripHtml(book.description || "");
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Opis knjige">
      <div className="modal-content modal-content--wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{book.title}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Zatvori">
            ×
          </button>
        </div>
        <div className="modal-body">
          {book.thumbnail && (
            <img src={book.thumbnail} alt={book.title} className="modal-thumbnail" />
          )}
          <div className="modal-details">
            {book.authors && book.authors.length > 0 && (
              <p className="meta"><strong>Autor(i):</strong> {book.authors.join(", ")}</p>
            )}
            {book.categories && book.categories.length > 0 && (
              <p className="meta"><strong>Žanr(ovi):</strong> {book.categories.join(", ")}</p>
            )}
            {book.publishedDate && (
              <p className="meta"><strong>Godina izdanja:</strong> {book.publishedDate}</p>
            )}
            <div className="modal-description-block">
              <h4 className="modal-description-title">Sažetak radnje</h4>
              <div className="modal-description-text">
                {description ? (
                  <p>{description}</p>
                ) : (
                  <p className="modal-no-description">Nema dostupnog opisa za ovu knjigu. Pogledaj više na Google Books.</p>
                )}
              </div>
            </div>
            {book.infoLink && (
              <a href={book.infoLink} target="_blank" rel="noreferrer" className="modal-link">
                Više informacija na Google Books
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchView({ onSave }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState([]);
  const [searchMessage, setSearchMessage] = useState("");
  const [selectedBook, setSelectedBook] = useState(null);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setSearchMessage("");
    try {
      const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.details ? `${data.error} — ${data.details}` : (data.error || "Greška pri pretrazi.");
        throw new Error(msg);
      }
      const data = await res.json();
      setResults(data.books || []);
      setSearchMessage(data.message || "");
      setSearchPerformed(true);
    } catch (err) {
      setError(err.message || "Neočekivana greška.");
      setSearchPerformed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel">
      <h2>AI pretraga knjiga</h2>
      <p className="subtitle">
        Ne moraš znati naslov – napiši sve što pamtiš: radnju, likove, scene, atmosferu.
        Što više napišeš, to je veća šansa da pronađemo knjigu.
      </p>
      <form onSubmit={handleSearch} className="search-form">
        <textarea
          rows={4}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Npr. 'Roman o djevojci koja putuje kroz vrijeme, nešto s vremenskom petljom i spašavanjem svijeta...'"
        />
        <p className="search-hint">
          Pretraga traži po opisu knjiga (Google Books + Open Library). Napiši bilo što što pamtiš – naslov nije potreban.
        </p>
        <button type="submit" disabled={loading}>
          {loading ? "Tražim..." : "Pretraži knjige"}
        </button>
      </form>
      {error && <div className="error">{error}</div>}
      {searchMessage && <div className="info">{searchMessage}</div>}
      {searchPerformed && !loading && results.length === 0 && (
        <div className="info empty-results">
          Nema pronađenih knjiga za ovaj opis. Pokušaj drugačije opisati – radnju, likove, žanr ili scene koje pamtiš.
        </div>
      )}
      {results.length > 0 && (
        <div className="results">
          <h3>Rezultati pretrage</h3>
          <ul className="book-list">
            {results.map((book) => (
              <li key={book.id} className="book-card">
                {book.thumbnail && (
                  <img src={book.thumbnail} alt={book.title} className="thumbnail" />
                )}
                <div className="book-info">
                  <h4>{book.title}</h4>
                  {book.authors && book.authors.length > 0 && (
                    <p className="meta">
                      <strong>Autor(i):</strong> {book.authors.join(", ")}
                    </p>
                  )}
                  {book.categories && book.categories.length > 0 && (
                    <p className="meta">
                      <strong>Žanr(ovi):</strong> {book.categories.join(", ")}
                    </p>
                  )}
                  {book.description ? (
                    <p className="description">
                      {book.description.length > 300
                        ? book.description.slice(0, 300) + "..."
                        : book.description}
                    </p>
                  ) : (
                    <p className="description">Nema opisa.</p>
                  )}
                  <div className="actions">
                    <button type="button" onClick={() => setSelectedBook(book)}>
                      Prikaži opis
                    </button>
                    <button onClick={() => onSave(book)}>Spremi u moju biblioteku</button>
                    {book.infoLink && (
                      <a href={book.infoLink} target="_blank" rel="noreferrer">
                        Više informacija
                      </a>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      <BookDescriptionModal book={selectedBook} onClose={() => setSelectedBook(null)} />
    </div>
  );
}

function LibraryView() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [genreFilter, setGenreFilter] = useState("");
  const [authorFilter, setAuthorFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedBook, setSelectedBook] = useState(null);

  const loadLibrary = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (genreFilter) params.append("genre", genreFilter);
      if (authorFilter) params.append("author", authorFilter);
      if (searchFilter) params.append("search", searchFilter);

      const res = await fetch(`${API_BASE}/api/library?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Greška pri dohvaćanju biblioteke.");
      }
      const data = await res.json();
      setBooks(data.books || []);
    } catch (err) {
      setError(err.message || "Neočekivana greška.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLibrary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Sigurno želiš obrisati ovu knjigu iz svoje biblioteke?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/library/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Greška pri brisanju knjige.");
      }
      setBooks((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      alert(err.message || "Neočekivana greška pri brisanju.");
    }
  };

  const uniqueGenres = Array.from(
    new Set(
      books.flatMap((b) => (b.categories || []).map((c) => c.trim())).filter(Boolean)
    )
  ).sort();

  const uniqueAuthors = Array.from(
    new Set(books.flatMap((b) => (b.authors || []).map((a) => a.trim())).filter(Boolean))
  ).sort();

  return (
    <div className="panel">
      <h2>Moja privatna biblioteka</h2>
      <p className="subtitle">
        Sve knjige koje spremiš iz AI pretrage pojavljuju se ovdje. Možeš ih filtrirati po
        žanru, autoru ili pretraživati po naslovu i opisu.
      </p>
      <div className="filters">
        <select
          value={genreFilter}
          onChange={(e) => setGenreFilter(e.target.value)}
          onBlur={loadLibrary}
        >
          <option value="">Svi žanrovi</option>
          {uniqueGenres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select
          value={authorFilter}
          onChange={(e) => setAuthorFilter(e.target.value)}
          onBlur={loadLibrary}
        >
          <option value="">Svi autori</option>
          {uniqueAuthors.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Traži po naslovu/opisu"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && loadLibrary()}
        />
        <button onClick={loadLibrary} disabled={loading}>
          Osvježi
        </button>
      </div>
      {loading && <div className="info">Učitavam tvoju biblioteku...</div>}
      {error && <div className="error">{error}</div>}
      {books.length === 0 && !loading && (
        <div className="info">
          Još nemaš spremljenih knjiga. Pretraži ih u AI pretrazi i spremi ih ovdje.
        </div>
      )}
      {books.length > 0 && (
        <ul className="book-list">
          {books.map((book) => (
            <li key={book.id} className="book-card">
              {book.thumbnail && (
                <img src={book.thumbnail} alt={book.title} className="thumbnail" />
              )}
              <div className="book-info">
                <h4>{book.title}</h4>
                {book.authors && book.authors.length > 0 && (
                  <p className="meta">
                    <strong>Autor(i):</strong> {book.authors.join(", ")}
                  </p>
                )}
                {book.categories && book.categories.length > 0 && (
                  <p className="meta">
                    <strong>Žanr(ovi):</strong> {book.categories.join(", ")}
                  </p>
                )}
                {book.description ? (
                  <p className="description">
                    {book.description.length > 300
                      ? book.description.slice(0, 300) + "..."
                      : book.description}
                  </p>
                ) : (
                  <p className="description">Nema opisa.</p>
                )}
                <div className="actions">
                  <button type="button" onClick={() => setSelectedBook(book)}>
                    Prikaži opis
                  </button>
                  {book.infoLink && (
                    <a href={book.infoLink} target="_blank" rel="noreferrer">
                      Više informacija
                    </a>
                  )}
                  <button className="danger" onClick={() => handleDelete(book.id)}>
                    Obriši iz biblioteke
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <BookDescriptionModal book={selectedBook} onClose={() => setSelectedBook(null)} />
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("search");
  const [toast, setToast] = useState("");

  const handleSave = async (book) => {
    try {
      const res = await fetch(`${API_BASE}/api/library`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(book)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Greška pri spremanju knjige.");
      }
      setToast(data.message || "Knjiga spremljena.");
      setTimeout(() => setToast(""), 2500);
    } catch (err) {
      setToast(err.message || "Neočekivana greška.");
      setTimeout(() => setToast(""), 3500);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>BookSeeker</h1>
        <p className="subtitle">
          Privatna AI knjižnica u kojoj pamtiš i organiziraš sve knjige koje voliš (ili
          ih tek tražiš).
        </p>
        <nav className="tabs">
          <button
            className={activeTab === "search" ? "active" : ""}
            onClick={() => setActiveTab("search")}
          >
            AI pretraga
          </button>
          <button
            className={activeTab === "library" ? "active" : ""}
            onClick={() => setActiveTab("library")}
          >
            Moja biblioteka
          </button>
        </nav>
      </header>
      <main>
        {activeTab === "search" ? (
          <SearchView onSave={handleSave} />
        ) : (
          <LibraryView />
        )}
      </main>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

