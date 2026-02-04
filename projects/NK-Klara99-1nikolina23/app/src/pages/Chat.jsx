import { useEffect, useMemo, useState } from "react";
import { supabase } from "../libs/supabaseClient";

export default function Chat({ tripId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const orderedMessages = useMemo(
    () =>
      [...messages].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      ),
    [messages]
  );

  async function refreshMessages() {
    if (!tripId) return;

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("trip_id", tripId)
      .order("created_at", { ascending: true });

    if (!error) setMessages(data ?? []);
  }

  useEffect(() => {
    refreshMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  async function send() {
    if (!text.trim() || !tripId) return;

    setBusy(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      console.log("FRONT TOKEN START:", token?.slice(0, 12)); // treba biti "eyJ..."
      if (!token) throw new Error("Nisi ulogiran/a.");

      const messageToSend = text.trim();
      setText("");
      console.log("token start:", token?.slice(0, 10));
      const r = await fetch("http://localhost:4000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tripId, message: messageToSend }),
      });

      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Greška na serveru");

      await refreshMessages();
    } catch (err) {
      alert(err?.message ?? "Greška u chatu");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {/* debug: ako je null/undefined, Send neće raditi */}
      <div style={{ fontSize: 12, color: "#64748b" }}>
        tripId: {String(tripId)}
      </div>

      <div
        style={{
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 12,
          height: 420,
          overflow: "auto",
        }}
      >
        {orderedMessages.length === 0 && (
          <div style={{ color: "#64748b" }}>
            Napiši poruku tipa:{" "}
            <b>“Idem iz Splita, budžet 1000€, želim negdje toplo”</b>
          </div>
        )}

        {orderedMessages.map((m) => (
          <div
            key={m.id}
            style={{
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              margin: "10px 0",
            }}
          >
            <div
              style={{
                maxWidth: "78%",
                padding: "10px 12px",
                borderRadius: 12,
                background: m.role === "user" ? "#4f46e5" : "#f1f5f9",
                color: m.role === "user" ? "white" : "#0f172a",
                whiteSpace: "pre-wrap",
              }}
            >
              {m.content}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Upiši poruku..."
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 10,
            border: "1px solid #d1d5db",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          disabled={busy}
        />
        <button
          onClick={send}
          disabled={busy}
          style={{ padding: "10px 14px", borderRadius: 10 }}
        >
          {busy ? "..." : "Send"}
        </button>
      </div>

      <div style={{ color: "#64748b", fontSize: 12 }}>
        *Odgovore generira backend server.
      </div>
    </div>
  );
}
