import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../libs/supabaseClient";
import Chat from "./Chat";

export default function AppHome() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [tripId, setTripId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) return nav("/login");

      setEmail(session.user.email);

      // osiguraj da user ima barem 1 trip (default)
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
            origin: "",
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

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#f3f5f9" }}>
      <div style={{ display: "flex", justifyContent: "space-between", padding: 16, borderBottom: "1px solid #e5e7eb", background: "white" }}>
        <div style={{ fontWeight: 700 }}>Travel Planner</div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ color: "#64748b", fontSize: 14 }}>{email}</div>
          <button onClick={signOut} style={{ borderRadius: 10, padding: "8px 12px" }}>Logout</button>
        </div>
      </div>

      <div style={{ maxWidth: 920, margin: "0 auto", padding: 16 }}>
        <h2 style={{ margin: "12px 0" }}>Chat</h2>
        <Chat tripId={tripId} />
      </div>
    </div>
  );
}
