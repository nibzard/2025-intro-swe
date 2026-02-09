import { useEffect, useState } from "react";
import { supabase } from "../libs/supabaseClient";
import { useConfirm } from "../libs/ConfirmModal";
import { useToast } from "../libs/toast";
import PDFManager from "./PDFManager";
import ExpenseTracker from "./ExpenseTracker";

export default function TripSidebar({ currentTripId, onSelectTrip, refreshKey = 0 }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("trips");
  const [renameModal, setRenameModal] = useState(null);
  const [renameText, setRenameText] = useState("");
  const [hoveredTrip, setHoveredTrip] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [hoveredTab, setHoveredTab] = useState(null);
  const confirm = useConfirm();
  const toast = useToast();

  useEffect(() => {
    loadTrips();
    
    // Subscribe to real-time updates on trips table
    const channel = supabase
      .channel('trips-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'trips' }, () => {
        loadTrips();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentTripId, refreshKey]);

  async function loadTrips() {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) return;

      const { data, error } = await supabase
        .from("trips")
        .select("id, title, destination, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error) {
        setTrips(data ?? []);
      } else {
        console.error("Error loading trips:", error);
      }
    } catch (err) {
      console.error("Error loading trips:", err);
    } finally {
      setLoading(false);
    }
  }

  async function createNewTrip() {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) throw new Error("Not logged in");

      const { data, error } = await supabase
        .from("trips")
        .insert({
          user_id: user.id,
          title: "New trip",
          destination: "",
        })
        .select("id")
        .single();

      if (!error) {
        loadTrips();
        onSelectTrip(data.id);
      }
    } catch (err) {
      console.error("Error creating trip:", err);
    }
  }

  function deleteTrip(id) {
    confirm("Delete this trip permanently? This cannot be undone.", async () => {
      try {
        await supabase.from("trips").delete().eq("id", id);
        loadTrips();
        if (id === currentTripId) onSelectTrip(null);
        toast.success("Trip deleted");
      } catch (err) {
        console.error("Error deleting trip:", err);
        toast.error("Failed to delete trip");
      }
    });
  }

  async function archiveTrip(id) {
    try {
      await supabase
        .from("trips")
        .update({ is_archived: true })
        .eq("id", id);
      loadTrips();
    } catch (err) {
      console.error("Error archiving trip:", err);
    }
  }

  async function renameTrip(id, newName) {
    if (!newName.trim()) return;
    try {
      await supabase
        .from("trips")
        .update({ title: newName.trim() })
        .eq("id", id);
      loadTrips();
      setRenameModal(null);
      setRenameText("");
    } catch (err) {
      console.error("Error renaming trip:", err);
    }
  }

  const tabs = [
    { id: "trips", label: "Trips", icon: "🗺️" },
    { id: "expenses", label: "Expenses", icon: "💰" },
    { id: "pdfs", label: "PDFs", icon: "📥" },
  ];

  return (
    <aside style={{
      width: 300,
      borderRight: "1px solid #e2e8f0",
      padding: 0,
      background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
      overflow: "auto",
      maxHeight: "100vh",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Sidebar Header */}
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid #e2e8f0",
        background: "white",
      }}>
        <h2 style={{
          margin: 0,
          fontSize: 14,
          fontWeight: 700,
          color: "#0f172a",
          letterSpacing: "-0.01em",
        }}>
          Your Workspace
        </h2>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex",
        gap: 4,
        padding: "12px 16px",
        background: "#f8fafc",
        borderBottom: "1px solid #e2e8f0",
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            onMouseEnter={() => setHoveredTab(tab.id)}
            onMouseLeave={() => setHoveredTab(null)}
            style={{
              flex: 1,
              padding: "8px 12px",
              border: "none",
              background: activeTab === tab.id
                ? "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)"
                : hoveredTab === tab.id
                  ? "rgba(79, 70, 229, 0.08)"
                  : "transparent",
              color: activeTab === tab.id ? "white" : "#64748b",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 600,
              whiteSpace: "nowrap",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              boxShadow: activeTab === tab.id ? "0 2px 8px rgba(79, 70, 229, 0.25)" : "none",
            }}
          >
            <span style={{ fontSize: 12 }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        {/* Trips Tab */}
        {activeTab === "trips" && (
          <>
            <button
              onClick={createNewTrip}
              style={{
                width: "100%",
                padding: "12px 16px",
                marginBottom: 16,
                background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                color: "white",
                border: "none",
                borderRadius: 10,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
                transition: "all 0.2s ease",
                boxShadow: "0 4px 12px rgba(79, 70, 229, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(79, 70, 229, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(79, 70, 229, 0.25)";
              }}
            >
              <span style={{ fontSize: 16 }}>+</span>
              <span>New Trip</span>
            </button>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {loading && (
                <div style={{
                  fontSize: 13,
                  color: "#64748b",
                  textAlign: "center",
                  padding: 20,
                }}>
                  Loading trips...
                </div>
              )}

              {trips.length === 0 && !loading && (
                <div style={{
                  textAlign: "center",
                  padding: "32px 16px",
                  color: "#64748b",
                }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>✈️</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>No trips yet</div>
                  <div style={{ fontSize: 12 }}>Create your first adventure!</div>
                </div>
              )}

              {trips.map((trip) => {
                const isActive = currentTripId === trip.id;
                const isHovered = hoveredTrip === trip.id;

                return (
                  <div
                    key={trip.id}
                    onMouseEnter={() => setHoveredTrip(trip.id)}
                    onMouseLeave={() => setHoveredTrip(null)}
                    style={{
                      textAlign: "left",
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: `1px solid ${isActive ? "#4f46e5" : isHovered ? "#c7d2fe" : "#e2e8f0"}`,
                      background: isActive
                        ? "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)"
                        : isHovered
                          ? "#f8fafc"
                          : "white",
                      transition: "all 0.2s ease",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                      boxShadow: isActive
                        ? "0 2px 8px rgba(79, 70, 229, 0.12)"
                        : isHovered
                          ? "0 2px 8px rgba(0, 0, 0, 0.06)"
                          : "none",
                      transform: isHovered && !isActive ? "translateX(2px)" : "none",
                    }}
                    onClick={() => onSelectTrip(trip.id)}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: isActive ? 600 : 500,
                        fontSize: 13,
                        color: isActive ? "#4f46e5" : "#0f172a",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}>
                        {trip.title || trip.destination || "New trip"}
                      </div>
                      <div style={{
                        fontSize: 11,
                        color: "#94a3b8",
                        marginTop: 3,
                      }}>
                        {new Date(trip.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </div>

                    {/* Three dots menu */}
                    <div style={{ position: "relative" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenu(openMenu === trip.id ? null : trip.id);
                        }}
                        style={{
                          opacity: isHovered || openMenu === trip.id ? 1 : 0,
                          transition: "all 0.2s ease",
                          background: openMenu === trip.id ? "#e0e7ff" : "transparent",
                          border: "none",
                          cursor: "pointer",
                          fontSize: 16,
                          padding: "4px 6px",
                          color: "#64748b",
                          borderRadius: 4,
                        }}
                      >
                        ⋮
                      </button>

                      {/* Dropdown menu */}
                      {openMenu === trip.id && (
                        <div
                          style={{
                            position: "absolute",
                            right: 0,
                            top: "100%",
                            marginTop: 4,
                            background: "white",
                            borderRadius: 10,
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
                            minWidth: 150,
                            zIndex: 100,
                            overflow: "hidden",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {[
                            { icon: "✏️", label: "Rename", onClick: () => { setRenameModal(trip.id); setRenameText(trip.title); setOpenMenu(null); } },
                            { icon: "📦", label: "Archive", onClick: () => { archiveTrip(trip.id); setOpenMenu(null); } },
                            { icon: "🗑️", label: "Delete", onClick: () => { deleteTrip(trip.id); setOpenMenu(null); }, danger: true },
                          ].map((action, i) => (
                            <button
                              key={i}
                              onClick={action.onClick}
                              style={{
                                width: "100%",
                                textAlign: "left",
                                padding: "10px 14px",
                                background: "none",
                                border: "none",
                                borderBottom: i < 2 ? "1px solid #f1f5f9" : "none",
                                cursor: "pointer",
                                fontSize: 13,
                                color: action.danger ? "#ef4444" : "#0f172a",
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                transition: "background 0.15s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = action.danger ? "#fef2f2" : "#f8fafc";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "transparent";
                              }}
                            >
                              <span>{action.icon}</span>
                              <span>{action.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Expenses Tab */}
        {activeTab === "expenses" && (
          <ExpenseTracker tripId={currentTripId} />
        )}

        {/* PDFs Tab */}
        {activeTab === "pdfs" && (
          <PDFManager tripId={currentTripId} />
        )}
      </div>

      {/* Rename Modal */}
      {renameModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            animation: "fadeIn 0.2s ease",
          }}
          onClick={() => setRenameModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              borderRadius: 16,
              padding: 24,
              minWidth: 340,
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
              animation: "fadeInUp 0.3s ease",
            }}
          >
            <div style={{
              fontWeight: 700,
              marginBottom: 16,
              fontSize: 16,
              color: "#0f172a",
            }}>
              Rename Trip
            </div>
            <input
              type="text"
              value={renameText}
              onChange={(e) => setRenameText(e.target.value)}
              placeholder="Enter new name..."
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                marginBottom: 16,
                fontSize: 14,
                boxSizing: "border-box",
                outline: "none",
                transition: "border-color 0.2s ease, box-shadow 0.2s ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#4f46e5";
                e.target.style.boxShadow = "0 0 0 4px rgba(79, 70, 229, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.boxShadow = "none";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  renameTrip(renameModal, renameText);
                }
              }}
              autoFocus
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setRenameModal(null)}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  backgroundColor: "#f1f5f9",
                  color: "#475569",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  transition: "background 0.2s ease",
                }}
                onMouseEnter={(e) => e.target.style.background = "#e2e8f0"}
                onMouseLeave={(e) => e.target.style.background = "#f1f5f9"}
              >
                Cancel
              </button>
              <button
                onClick={() => renameTrip(renameModal, renameText)}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  boxShadow: "0 2px 8px rgba(79, 70, 229, 0.25)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-1px)";
                  e.target.style.boxShadow = "0 4px 12px rgba(79, 70, 229, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 2px 8px rgba(79, 70, 229, 0.25)";
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
