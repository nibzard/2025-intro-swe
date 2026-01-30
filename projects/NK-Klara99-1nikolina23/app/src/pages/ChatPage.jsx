import { useEffect, useState } from "react";
import { supabase } from "../libs/supabaseClient";
import Chat from "./Chat";

export default function ChatPage() {
  const [tripId, setTripId] = useState(null);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;

      if (!user) {
        setErrMsg("Nema sessiona (nisi ulogirana ili se session nije učitao).");
        return;
      }

      const { data: trip, error } = await supabase
        .from("trips")
        .insert({
          user_id: user.id,
          title: "New trip",
          destination: "TBD" // privremeno samo da prođe NOT NULL
          // ako ti i origin_city ima NOT NULL, dodaj:
          // origin_city: "TBD",
        })
        .select("id")
        .single();

      if (error) {
        console.error("TRIPS INSERT ERROR:", error);
        setErrMsg(`${error.code ?? ""} ${error.message}`);
        return;
      }

      setTripId(trip.id);
    })();
  }, []);

  if (errMsg) return <div style={{ color: "crimson" }}>Error: {errMsg}</div>;
  if (!tripId) return <div>Loading trip...</div>;
  return <Chat tripId={tripId} />;
}
