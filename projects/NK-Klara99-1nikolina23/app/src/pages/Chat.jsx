import { useEffect, useMemo, useState } from "react";
import { supabase } from "../libs/supabaseClient";
import { parseUserInput, getMissingData, generateItinerary } from "../libs/chatParser";
import { useToast } from "../libs/toast";
import Itinerary from "./Itinerary";

// Call the LLM-powered chat API
async function generateAssistantReply(tripId, userText, preferences, recentMessages) {
  try {
    const response = await fetch("http://localhost:3001/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tripId,
        userText,
        preferences,
        recentMessages: recentMessages.slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      throw new Error("API request failed");
    }

    const data = await response.json();

    // Merge preferences
    const updatedPreferences = { ...preferences };
    if (data.preferencesPatch) {
      Object.entries(data.preferencesPatch).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          updatedPreferences[key] = value;
        }
      });
    }

    // Collect places from LLM recommendations
    const existingPlaces = updatedPreferences.recommendedPlaces || [];
    if (data.places && data.places.length > 0) {
      // Add new places, avoid duplicates
      data.places.forEach((place) => {
        if (place.name && !existingPlaces.some((p) => p.name === place.name)) {
          existingPlaces.push(place);
        }
      });
      updatedPreferences.recommendedPlaces = existingPlaces;
    }

    // Generate itinerary if ready
    let itinerary = null;
    if (data.shouldGenerateItinerary) {
      itinerary = generateItinerary(updatedPreferences);

      // Add recommended places to itinerary
      if (updatedPreferences.recommendedPlaces?.length > 0) {
        itinerary.recommendedPlaces = updatedPreferences.recommendedPlaces;
      }

      // Enrich with real data
      try {
        const params = new URLSearchParams({
          destination: updatedPreferences.destination || "",
          origin: updatedPreferences.origin || "Unknown",
          startDate: updatedPreferences.startDate || "",
          endDate: updatedPreferences.endDate || "",
          people: updatedPreferences.people || 1,
        });

        const enrichResponse = await fetch(`http://localhost:3001/api/enrich?${params}`);
        if (enrichResponse.ok) {
          const enriched = await enrichResponse.json();
          if (enriched.places?.length > 0) {
            itinerary.restaurants = enriched.places.slice(0, 3);
          }
          if (enriched.flights) {
            itinerary.flightEstimate = enriched.flights;
          }
          if (enriched.hotels) {
            itinerary.hotels = enriched.hotels;
          }
        }
      } catch (err) {
        console.warn("Enrichment failed:", err);
      }
    }

    return {
      text: data.assistantText,
      preferences: updatedPreferences,
      itinerary,
      suggestedTitle: data.suggestedTitle,
      places: data.places || [],
    };
  } catch (err) {
    console.error("LLM API failed, using fallback:", err);
    return generateFallbackReply(userText, preferences);
  }
}

// Fallback to regex parsing if API fails
function generateFallbackReply(userText, preferences) {
  const parsed = parseUserInput(userText);
  const updated = { ...preferences };

  if (parsed.origin) updated.origin = parsed.origin;
  if (parsed.destination) updated.destination = parsed.destination;
  if (parsed.startDate) updated.startDate = parsed.startDate;
  if (parsed.budget) updated.budget = parsed.budget;
  if (parsed.people) updated.people = parsed.people;
  if (parsed.style) updated.style = parsed.style;

  const missing = getMissingData(updated);

  if (missing.length) {
    return {
      text: `I'd love to help! Could you tell me your ${missing[0]}?`,
      preferences: updated,
      itinerary: null,
      suggestedTitle: updated.destination ? `${updated.destination} Trip` : null,
    };
  }

  const itinerary = generateItinerary(updated);
  return {
    text: `Great! I've created your itinerary for ${updated.destination}. Check it out below!`,
    preferences: updated,
    itinerary,
    suggestedTitle: `${updated.destination} Trip`,
  };
}

function TypingIndicator() {
  return (
    <div style={{
      display: "flex",
      justifyContent: "flex-start",
      margin: "12px 0",
      animation: "fadeIn 0.3s ease",
    }}>
      <div style={{
        padding: "14px 18px",
        borderRadius: 16,
        borderBottomLeftRadius: 4,
        background: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)",
        display: "flex",
        alignItems: "center",
        gap: 6,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
      }}>
        <span className="typing-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: "#94a3b8" }} />
        <span className="typing-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: "#94a3b8" }} />
        <span className="typing-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: "#94a3b8" }} />
      </div>
    </div>
  );
}

function PreferenceChips({ preferences }) {
  const chips = [];
  if (preferences.origin) chips.push({ label: "From", value: preferences.origin, icon: "📍" });
  if (preferences.destination) chips.push({ label: "To", value: preferences.destination, icon: "🎯" });
  if (preferences.startDate) chips.push({ label: "Dates", value: preferences.startDate, icon: "📅" });
  if (preferences.budget) chips.push({ label: "Budget", value: `€${preferences.budget}`, icon: "💰" });
  if (preferences.people) chips.push({ label: "Travelers", value: preferences.people, icon: "👥" });
  if (preferences.style) chips.push({ label: "Style", value: preferences.style, icon: "✨" });

  if (chips.length === 0) return null;

  return (
    <div style={{
      display: "flex",
      flexWrap: "wrap",
      gap: 8,
      padding: "12px 16px",
      background: "linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)",
      borderRadius: 12,
      marginBottom: 12,
      border: "1px solid #fde047",
    }}>
      {chips.map((chip, i) => (
        <div key={i} style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          background: "white",
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 500,
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
        }}>
          <span>{chip.icon}</span>
          <span style={{ color: "#64748b" }}>{chip.label}:</span>
          <span style={{ color: "#0f172a", fontWeight: 600 }}>{chip.value}</span>
        </div>
      ))}
    </div>
  );
}

function ExamplePrompts({ onSelect }) {
  const examples = [
    { text: "From Split to Rome, 10-14.3, budget 500€ for 2 people", icon: "🇮🇹" },
    { text: "Paris trip, next weekend, €800 budget, romantic style", icon: "🇫🇷" },
    { text: "Barcelona from London, 5 days, €600 for solo adventure", icon: "🇪🇸" },
  ];

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      padding: 24,
    }}>
      <div style={{
        width: 64,
        height: 64,
        borderRadius: 16,
        background: "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
        boxShadow: "0 4px 16px rgba(79, 70, 229, 0.15)",
      }}>
        <span style={{ fontSize: 32 }}>💬</span>
      </div>
      <h3 style={{
        margin: 0,
        fontSize: 18,
        fontWeight: 700,
        color: "#0f172a",
        marginBottom: 8,
      }}>
        Start planning your trip
      </h3>
      <p style={{
        margin: 0,
        fontSize: 14,
        color: "#64748b",
        marginBottom: 20,
        textAlign: "center",
      }}>
        Tell me about your dream destination, and I'll create the perfect itinerary.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 400 }}>
        {examples.map((example, i) => (
          <button
            key={i}
            onClick={() => onSelect(example.text)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              background: "white",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.2s ease",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#4f46e5";
              e.currentTarget.style.background = "#f8fafc";
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(79, 70, 229, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e2e8f0";
              e.currentTarget.style.background = "white";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.05)";
            }}
          >
            <span style={{ fontSize: 24 }}>{example.icon}</span>
            <span style={{ fontSize: 13, color: "#475569", lineHeight: 1.4 }}>{example.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Chat({ tripId, onTripUpdated }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [preferences, setPreferences] = useState({});
  const [itinerary, setItinerary] = useState(null);
  const toast = useToast();

  const orderedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
    [messages]
  );

  useEffect(() => {
    if (!tripId) return;

    let alive = true;
    
    // Reset state when switching trips
    setMessages([]);
    setPreferences({});
    setItinerary(null);
    
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) return;

      // Load messages
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("trip_id", tripId)
        .order("created_at", { ascending: true });

      if (!alive) return;
      if (!error) setMessages(data ?? []);

      // Load trip data (preferences and itinerary)
      const { data: tripData, error: tripError } = await supabase
        .from("trips")
        .select("preferences, itinerary_json")
        .eq("id", tripId)
        .single();

      if (!alive) return;
      
      if (tripError) {
        console.error("Failed to load trip:", tripError);
        return;
      }

      // Load preferences
      if (tripData?.preferences) {
        setPreferences(tripData.preferences);
      }
      
      // Load saved itinerary - this ensures it persists across chat switches
      if (tripData?.itinerary_json) {
        console.log("Loading saved itinerary:", tripData.itinerary_json);
        setItinerary(tripData.itinerary_json);
      }
    })();

    return () => {
      alive = false;
    };
  }, [tripId]);

  async function send(customText) {
    const messageText = customText || text;
    if (!messageText.trim() || !tripId) return;

    setBusy(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) throw new Error("Not logged in.");

      const userMsg = {
        trip_id: tripId,
        user_id: user.id,
        role: "user",
        content: messageText.trim(),
      };

      const { data: insertedUser, error: e1 } = await supabase
        .from("messages")
        .insert(userMsg)
        .select()
        .single();
      if (e1) throw e1;

      setMessages((prev) => [...prev, insertedUser]);
      setText("");

      const reply = await generateAssistantReply(tripId, insertedUser.content, preferences, orderedMessages);

      // Always update preferences if we have them
      if (reply.preferences) {
        setPreferences(reply.preferences);
      }

      // Build update data for the trip
      const updateData = {};
      
      // Always save preferences
      if (reply.preferences) {
        updateData.preferences = reply.preferences;
      }
      
      // Always save itinerary if we have one (new or existing)
      if (reply.itinerary) {
        updateData.itinerary_json = reply.itinerary;
      }
      
      // Get destination from preferences
      const destination = reply.preferences?.destination;
      
      // Always update title and destination when we have a destination
      if (destination) {
        updateData.destination = destination;
        // Use suggestedTitle if provided, otherwise create from destination
        updateData.title = reply.suggestedTitle || `${destination} Trip`;
      } else if (reply.suggestedTitle) {
        // Fallback: use suggestedTitle even without destination
        updateData.title = reply.suggestedTitle;
        updateData.destination = reply.suggestedTitle.replace(/ Trip$/i, '');
      }
      
      // Debug log
      console.log("Trip update data:", updateData);

      // Save to database if we have anything to update
      if (Object.keys(updateData).length > 0) {
        // Only update columns that exist in the table
        // Adjust this based on your actual Supabase schema
        const safeUpdateData = {};
        
        if (updateData.title) safeUpdateData.title = updateData.title;
        if (updateData.destination) safeUpdateData.destination = updateData.destination;
        if (updateData.preferences) safeUpdateData.preferences = updateData.preferences;
        if (updateData.itinerary_json) safeUpdateData.itinerary_json = updateData.itinerary_json;
        
        console.log("Saving to Supabase:", safeUpdateData);
        
        // Try updating with all fields first
        let { error: updateError, data: updateResult } = await supabase
          .from("trips")
          .update(safeUpdateData)
          .eq("id", tripId)
          .select();
        
        console.log("Update result:", updateResult, "Error:", updateError);
        
        // If that fails, try with just title (most basic update)
        if (updateError) {
          console.warn("Full update failed:", updateError.code, updateError.message, updateError.details);
          
          if (safeUpdateData.title) {
            const { error: titleError } = await supabase
              .from("trips")
              .update({ title: safeUpdateData.title })
              .eq("id", tripId);
            
            if (titleError) {
              console.error("Title update also failed:", titleError);
            } else {
              console.log("Title updated successfully!");
              updateError = null; // Clear error since title worked
            }
          }
        }
        
        if (!updateError) {
          console.log("Trip updated successfully, refreshing sidebar...");
          if (onTripUpdated) {
            onTripUpdated();
          }
        }
      }

      if (reply.itinerary) setItinerary(reply.itinerary);

      const assistantMsg = {
        trip_id: tripId,
        user_id: user.id,
        role: "assistant",
        content: reply.text,
      };

      const { data: insertedA, error: e2 } = await supabase
        .from("messages")
        .insert(assistantMsg)
        .select()
        .single();
      if (e2) throw e2;

      setMessages((prev) => [...prev, insertedA]);
    } catch (err) {
      toast.error(err?.message ?? "Chat error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Preference Chips */}
      <PreferenceChips preferences={preferences} />

      {/* Chat Container */}
      <div style={{
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        padding: 20,
        height: 420,
        overflow: "auto",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
      }}>
        {orderedMessages.length === 0 && !busy ? (
          <ExamplePrompts onSelect={(prompt) => send(prompt)} />
        ) : (
          <>
            {orderedMessages.map((m, index) => (
              <div
                key={m.id}
                className="message-animate"
                style={{
                  display: "flex",
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                  margin: "12px 0",
                  animationDelay: `${index * 0.05}s`,
                }}
              >
                <div
                  style={{
                    maxWidth: "78%",
                    padding: "12px 16px",
                    borderRadius: 16,
                    borderBottomRightRadius: m.role === "user" ? 4 : 16,
                    borderBottomLeftRadius: m.role === "user" ? 16 : 4,
                    background: m.role === "user"
                      ? "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)"
                      : "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)",
                    color: m.role === "user" ? "white" : "#0f172a",
                    whiteSpace: "pre-wrap",
                    fontSize: 14,
                    lineHeight: 1.5,
                    boxShadow: m.role === "user"
                      ? "0 4px 12px rgba(79, 70, 229, 0.25)"
                      : "0 2px 8px rgba(0, 0, 0, 0.06)",
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {busy && <TypingIndicator />}
          </>
        )}
      </div>

      {/* Input Container */}
      <div style={{
        display: "flex",
        gap: 10,
        padding: 6,
        background: "white",
        borderRadius: 14,
        border: "1px solid #e2e8f0",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
      }}>
        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 12px",
        }}>
          <span style={{ fontSize: 18, opacity: 0.5 }}>✏️</span>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Describe your dream trip..."
            style={{
              flex: 1,
              padding: "12px 0",
              border: "none",
              outline: "none",
              fontSize: 14,
              background: "transparent",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) send();
            }}
            disabled={busy}
          />
        </div>
        <button
          onClick={() => send()}
          disabled={busy || !text.trim()}
          style={{
            padding: "12px 20px",
            borderRadius: 10,
            border: "none",
            background: busy || !text.trim()
              ? "#e2e8f0"
              : "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
            color: busy || !text.trim() ? "#94a3b8" : "white",
            fontWeight: 600,
            fontSize: 14,
            cursor: busy || !text.trim() ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: busy || !text.trim() ? "none" : "0 4px 12px rgba(79, 70, 229, 0.25)",
          }}
        >
          {busy ? (
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ animation: "pulse 1s infinite" }}>⏳</span>
              Thinking...
            </span>
          ) : (
            <>
              <span>Send</span>
              <span>→</span>
            </>
          )}
        </button>
      </div>

      {itinerary && (
        <Itinerary 
          itinerary={itinerary} 
          tripTitle={preferences.destination ? `${preferences.destination} Trip` : "My Trip"} 
          tripId={tripId}
        />
      )}
    </div>
  );
}
