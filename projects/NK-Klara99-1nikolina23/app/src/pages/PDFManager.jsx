import { useEffect, useState } from "react";
import { supabase } from "../libs/supabaseClient";
import { generatePDF } from "../libs/pdfExport";

const PDF_STORAGE_KEY = "travel_planner_pdfs";

function loadStoredPDFs() {
  try {
    const stored = localStorage.getItem(PDF_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveStoredPDFs(pdfs) {
  try {
    localStorage.setItem(PDF_STORAGE_KEY, JSON.stringify(pdfs));
  } catch (err) {
    console.error("Error saving PDFs:", err);
  }
}

export function addPDFToHistory(tripId, title, destination, itinerary) {
  const pdfs = loadStoredPDFs();
  const newPDF = {
    id: `${tripId}-${Date.now()}`,
    tripId,
    title: title || destination || "Itinerary",
    destination,
    itinerary, // Store itinerary for re-download
    createdAt: new Date().toISOString(),
  };
  
  // Add to beginning, keep last 10 (itineraries are larger)
  const updated = [newPDF, ...pdfs].slice(0, 10);
  saveStoredPDFs(updated);
  return updated;
}

export default function PDFManager({ tripId }) {
  const [pdfs, setPdfs] = useState([]);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load PDF history from localStorage
    setPdfs(loadStoredPDFs());
  }, []);

  useEffect(() => {
    if (!tripId) {
      setCurrentTrip(null);
      return;
    }

    async function loadCurrentTrip() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("trips")
          .select("itinerary_json, title, destination, preferences")
          .eq("id", tripId)
          .single();

        if (!error && data?.itinerary_json) {
          setCurrentTrip({
            id: tripId,
            title: data.title || data.destination || "Itinerary",
            destination: data.destination,
            itinerary: data.itinerary_json,
          });
        } else {
          setCurrentTrip(null);
        }
      } catch (err) {
        console.error("Error loading trip:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCurrentTrip();
  }, [tripId]);

  function handleDownload() {
    if (!currentTrip?.itinerary) return;
    
    generatePDF(currentTrip.itinerary, currentTrip.title);
    
    // Add to history
    const updated = addPDFToHistory(currentTrip.id, currentTrip.title, currentTrip.destination);
    setPdfs(updated);
  }

  function handleDeletePDF(pdfId) {
    const updated = pdfs.filter(p => p.id !== pdfId);
    saveStoredPDFs(updated);
    setPdfs(updated);
  }

  function handleRedownload(pdf) {
    if (pdf.itinerary) {
      generatePDF(pdf.itinerary, pdf.title);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Current Trip PDF */}
      {currentTrip?.itinerary && (
        <div style={{
          padding: 16,
          background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
          borderRadius: 12,
          border: "1px solid #6ee7b7",
        }}>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14, color: "#065f46" }}>
            📄 Current Itinerary
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
            {currentTrip.title}
          </div>
          <div style={{ fontSize: 12, color: "#047857", marginBottom: 12 }}>
            {currentTrip.itinerary.days?.length || 0} days planned
          </div>
          <button
            onClick={handleDownload}
            style={{
              width: "100%",
              padding: "10px 12px",
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(16, 185, 129, 0.3)";
            }}
          >
            <span>⬇️</span>
            <span>Download PDF</span>
          </button>
        </div>
      )}

      {!currentTrip?.itinerary && !loading && pdfs.length === 0 && (
        <div style={{
          padding: 16,
          background: "#f8fafc",
          borderRadius: 12,
          border: "1px dashed #cbd5e1",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
          <div style={{ fontSize: 13, color: "#64748b" }}>
            No itinerary yet. Chat with the assistant to create one!
          </div>
        </div>
      )}

      {/* PDF History */}
      <div>
        <div style={{
          fontWeight: 600,
          marginBottom: 12,
          fontSize: 13,
          color: "#475569",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}>
          <span>📥</span>
          <span>Download History</span>
          <span style={{
            background: "#e2e8f0",
            padding: "2px 8px",
            borderRadius: 10,
            fontSize: 11,
            fontWeight: 500,
          }}>
            {pdfs.length}
          </span>
        </div>

        {pdfs.length === 0 ? (
          <div style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>
            No downloads yet
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pdfs.map((pdf) => (
              <div
                key={pdf.id}
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  background: "white",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 12, color: "#1e293b" }}>
                      📄 {pdf.title}
                    </div>
                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                      {new Date(pdf.createdAt).toLocaleDateString()} {new Date(pdf.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeletePDF(pdf.id)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 14,
                      color: "#94a3b8",
                      padding: 4,
                      borderRadius: 4,
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#ef4444";
                      e.currentTarget.style.background = "#fef2f2";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#94a3b8";
                      e.currentTarget.style.background = "none";
                    }}
                    title="Remove from history"
                  >
                    ✕
                  </button>
                </div>
                {pdf.itinerary && (
                  <button
                    onClick={() => handleRedownload(pdf)}
                    style={{
                      width: "100%",
                      padding: "6px 10px",
                      background: "#10b981",
                      color: "white",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 11,
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    ⬇️ Download Again
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
