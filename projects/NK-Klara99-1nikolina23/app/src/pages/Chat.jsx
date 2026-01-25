import { useEffect, useMemo, useState } from "react";
import { supabase } from "../libs/supabaseClient";

// Minimalna “AI” logika (rule-based). Kasnije ovo premjestite u backend.
function mockAssistantReply(userText) {
  const t = userText.toLowerCase();

  const needs = [];
  if (!t.includes("from") && !t.includes("polaz") && !t.includes("od ")) needs.push("odakle krećeš (origin)");
  if (!t.includes("to") && !t.includes("u ")) needs.push("kamo ideš (destination)");
  if (!t.includes("budget") && !t.includes("budž")) needs.push("budžet");
  if (!t.includes("date") && !t.includes("mjesec") && !t.includes("datum")) needs.push("datume");

  if (needs.length) {
    return `Da složim plan, treba mi još: ${needs.join(", ")}. Napiši npr: "Origin: Split, Destination: Rim, Datumi: 10-14.3, Budžet: 500€".`;
  }

  return `Evo prijedloga (mock podaci, bez plaćenih API-ja):
- Letovi: (placeholder) provjeri Skyscanner/Google Flights ručno
- 3 dana itinerary:
  Day 1: centar + top atrakcije
  Day 2: muzeji + lokalna hrana
  Day 3: izlet + shopping
Ako želiš, reci broj osoba i stil (budget/standard).`;
}

export default function Chat({ tripId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const orderedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
    [messages]
  );

  useEffect(() => {
    if (!tripId) return;

    let alive = true;
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) return;

      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("trip_id", tripId)
        .order("created_at", { ascending: true });

      if (!alive) return;
      if (!error) setMessages(data ?? []);
    })();

    return () => {
      alive = false;
    };
  }, [tripId]);

  async function send() {
    if (!text.trim() || !tripId) return;

    setBusy(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) throw new Error("Nisi ulogiran/a.");

      // 1) spremi user poruku
      const userMsg = {
        trip_id: tripId,
        user_id: user.id,
        role: "user",
        content: text.trim(),
      };

      const { data: insertedUser, error: e1 } = await supabase
        .from("chat_messages")
        .insert(userMsg)
        .select()
        .single();
      if (e1) throw e1;

      setMessages((prev) => [...prev, insertedUser]);
      setText("");

      // 2) generiraj assistant odgovor (mock)
      const reply = mockAssistantReply(insertedUser.content);

      const assistantMsg = {
        trip_id: tripId,
        user_id: user.id,
        role: "assistant",
        content: reply,
      };

      const { data: insertedA, error: e2 } = await supabase
        .from("chat_messages")
        .insert(assistantMsg)
        .select()
        .single();
      if (e2) throw e2;

      setMessages((prev) => [...prev, insertedA]);
    } catch (err) {
      alert(err?.message ?? "Greška u chatu");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, height: 420, overflow: "auto" }}>
        {orderedMessages.length === 0 && (
          <div style={{ color: "#64748b" }}>
            Napiši poruku tipa: <b>“Origin: Split, Destination: Rim, Datumi: 10-14.3, Budžet: 500€”</b>
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
          style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid #d1d5db" }}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          disabled={busy}
        />
        <button onClick={send} disabled={busy} style={{ padding: "10px 14px", borderRadius: 10 }}>
          {busy ? "..." : "Send"}
        </button>
      </div>

      <div style={{ color: "#64748b", fontSize: 12 }}>
        *Napomena: ovo su mock odgovori (bez plaćenih API-ja). Kasnije zamijenite backend endpointom.
      </div>
    </div>
  );
}
