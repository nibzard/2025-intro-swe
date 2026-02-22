import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../libs/supabaseClient";
import Chat from "./Chat";
import TripSidebar from "./TripSidebar";

export default function AppHome() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [tripId, setTripId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0);

  // Function to trigger sidebar refresh (called by Chat when trip is updated)
  const refreshSidebar = () => setSidebarRefreshKey(k => k + 1);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) return nav("/login");

      setEmail(session.user.email);

      const { data: trips } = await supabase
        .from("trips")
        .select("id")
        .order("created_at", { ascending: true })
        .limit(1);

      if (trips?.length) {
        setTripId(trips[0].id);
      } else {
        const { data: created, error } = await supabase
          .from("trips")
          .insert({
            user_id: session.user.id,
            title: "My first trip",
            origin_city: "",
            destination: "",
          })
          .select("id")
          .single();
        if (!error) setTripId(created.id);
      }

      setLoading(false);
    })();
  }, [nav]);

  async function signOut() {
    await supabase.auth.signOut();
    nav("/login");
  }

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)",
      }}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "pulse 1.5s infinite",
          }}>
            <span style={{ fontSize: 24 }}>✈</span>
          </div>
          <div style={{ color: "#64748b", fontSize: 14, fontWeight: 500 }}>Loading your trips...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 24px",
        background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #4338ca 100%)",
        boxShadow: "0 4px 20px rgba(79, 70, 229, 0.25)",
        position: "relative",
        zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "rgba(255, 255, 255, 0.2)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          }}>
            <span style={{ fontSize: 22 }}>✈</span>
          </div>
          <div>
            <div style={{
              fontWeight: 700,
              fontSize: 18,
              color: "white",
              letterSpacing: "-0.02em",
            }}>
              TripPlanner
            </div>
            <div style={{
              fontSize: 11,
              color: "rgba(255, 255, 255, 0.7)",
              fontWeight: 500,
            }}>
              AI-Powered Itineraries
            </div>
          </div>
        </div>

        {/* User Menu */}
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "6px 12px",
            background: "rgba(255, 255, 255, 0.15)",
            borderRadius: 20,
            backdropFilter: "blur(10px)",
          }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              color: "white",
              fontWeight: 600,
            }}>
              {email.charAt(0).toUpperCase()}
            </div>
            <span style={{ color: "white", fontSize: 13, fontWeight: 500 }}>{email}</span>
          </div>
          <button
            onClick={signOut}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid rgba(255, 255, 255, 0.3)",
              background: "rgba(255, 255, 255, 0.1)",
              color: "white",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "rgba(255, 255, 255, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "rgba(255, 255, 255, 0.1)";
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ display: "flex", flex: 1 }}>
        <TripSidebar currentTripId={tripId} onSelectTrip={setTripId} refreshKey={sidebarRefreshKey} />
        <main style={{
          flex: 1,
          padding: 24,
          overflow: "auto",
          background: "linear-gradient(180deg, #f1f5f9 0%, #f8fafc 100%)",
        }}>
          {tripId ? (
            <Chat tripId={tripId} key={tripId} onTripUpdated={refreshSidebar} />
          ) : (
            <div style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: 40,
            }}>
              <div style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                background: "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 24,
                boxShadow: "0 8px 24px rgba(79, 70, 229, 0.15)",
              }}>
                <span style={{ fontSize: 40 }}>🌍</span>
              </div>
              <h2 style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#0f172a",
                marginBottom: 8,
              }}>
                Welcome to TripPlanner
              </h2>
              <p style={{
                color: "#64748b",
                fontSize: 15,
                maxWidth: 400,
                lineHeight: 1.6,
              }}>
                Create your first trip from the sidebar, then chat with our AI to build your perfect itinerary.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
