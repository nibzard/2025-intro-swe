import { generatePDF } from "../libs/pdfExport";
import { addPDFToHistory } from "./PDFManager";
import { useToast } from "../libs/toast";

export default function Itinerary({ itinerary, tripTitle = "My Trip", tripId }) {
  const toast = useToast();

  if (!itinerary) return null;

  function handleDownload() {
    generatePDF(itinerary, tripTitle);
    if (tripId) {
      addPDFToHistory(tripId, tripTitle, itinerary.destination, itinerary);
    }
    toast.success("PDF downloaded successfully!");
  }

  return (
    <div style={{ marginTop: 20, padding: 16, background: "white", borderRadius: 12, border: "1px solid #e5e7eb" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <h3 style={{ margin: 0 }}>📍 {itinerary.destination}</h3>
        <button
          onClick={handleDownload}
          style={{
            padding: "8px 16px",
            backgroundColor: "#4f46e5",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          📥 Download PDF
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 12 }}>
        {itinerary.days.map((day, idx) => (
          <div
            key={idx}
            style={{
              padding: 12,
              backgroundColor: "#f8fafc",
              borderRadius: 8,
              borderLeft: "4px solid #4f46e5",
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
              Day {day.day}
            </div>

            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
              Budget: €{day.estimatedCost} per person
            </div>

            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Activities:</div>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12 }}>
                {day.activities.map((act, i) => (
                  <li key={i} style={{ marginBottom: 2 }}>
                    {act}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Meals:</div>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12 }}>
                {day.meals.map((meal, i) => (
                  <li key={i} style={{ marginBottom: 2 }}>
                    {meal}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, padding: 12, backgroundColor: "#f0f4ff", borderRadius: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Trip Summary</div>
        <div style={{ fontSize: 12, color: "#64748b" }}>
          🎒 <strong>{itinerary.people}</strong> person{itinerary.people > 1 ? "s" : ""} | 💶{" "}
          <strong>€{itinerary.totalBudget}</strong> total | 🎯 <strong>{itinerary.style}</strong> style
        </div>
      </div>

      {/* Flight Estimate */}
      {itinerary.flightEstimate && (
        <div style={{ background: "#fef3c7", borderRadius: 8, padding: 12, border: "1px solid #fcd34d" }}>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>✈️ Flight Estimate</div>
          <div style={{ fontSize: 12, color: "#92400e", marginBottom: 8 }}>
            <strong>€{itinerary.flightEstimate.estimatedPricePerPerson}</strong> per person |{" "}
            <strong>€{itinerary.flightEstimate.totalEstimate}</strong> total
          </div>
          <div style={{ fontSize: 11, color: "#b45309", marginBottom: 8 }}>
            {itinerary.flightEstimate.disclaimer}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <a
              href={itinerary.flightEstimate.searchLinks.googleFlights}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 11,
                backgroundColor: "#fbbf24",
                color: "#000",
                padding: "6px 10px",
                borderRadius: 4,
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Google Flights
            </a>
            <a
              href={itinerary.flightEstimate.searchLinks.skyscanner}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 11,
                backgroundColor: "#fbbf24",
                color: "#000",
                padding: "6px 10px",
                borderRadius: 4,
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Skyscanner
            </a>
          </div>
        </div>
      )}

      {/* AI Recommended Places */}
      {itinerary.recommendedPlaces && itinerary.recommendedPlaces.length > 0 && (
        <div style={{ background: "linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%)", borderRadius: 8, padding: 12, border: "1px solid #e879f9", marginTop: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13, color: "#a21caf" }}>✨ Recommended by AI</div>
          <div style={{ display: "grid", gap: 8 }}>
            {itinerary.recommendedPlaces.map((place, idx) => (
              <div key={idx} style={{ padding: 10, backgroundColor: "white", borderRadius: 6, border: "1px solid #f0abfc" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14 }}>
                    {place.type === "restaurant" ? "🍽️" : 
                     place.type === "cafe" ? "☕" : 
                     place.type === "attraction" ? "🎡" : 
                     place.type === "museum" ? "🏛️" : 
                     place.type === "bar" ? "🍸" : 
                     place.type === "park" ? "🌳" : 
                     place.type === "landmark" ? "🏰" : "📍"}
                  </span>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#701a75" }}>{place.name}</div>
                </div>
                {place.description && (
                  <div style={{ fontSize: 11, color: "#86198f", marginLeft: 22 }}>{place.description}</div>
                )}
                <div style={{ fontSize: 10, color: "#a855f7", marginLeft: 22, marginTop: 2, textTransform: "capitalize" }}>
                  {place.type}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Restaurants from API */}
      {itinerary.restaurants && itinerary.restaurants.length > 0 && (
        <div style={{ background: "white", borderRadius: 8, padding: 12, border: "1px solid #e5e7eb", marginTop: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>🍽️ Nearby Restaurants</div>
          <div style={{ display: "grid", gap: 8 }}>
            {itinerary.restaurants.map((restaurant, idx) => (
              <div key={idx} style={{ padding: 8, backgroundColor: "#f9fafb", borderRadius: 6 }}>
                <div style={{ fontWeight: 500, fontSize: 12 }}>{restaurant.name}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{restaurant.address}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hotels */}
      {itinerary.hotels && (
        <div style={{ background: "#f0f9ff", borderRadius: 8, padding: 12, border: "1px solid #7dd3fc", marginTop: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>🏨 Accommodation Options</div>
          
          {itinerary.hotels.hotels && itinerary.hotels.hotels.length > 0 && (
            <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
              {itinerary.hotels.hotels.map((hotel, idx) => (
                <div key={idx} style={{ padding: 8, backgroundColor: "white", borderRadius: 6 }}>
                  <div style={{ fontWeight: 500, fontSize: 12 }}>{hotel.name}</div>
                  {hotel.pricePerNight && (
                    <div style={{ fontSize: 11, color: "#0369a1" }}>
                      €{hotel.pricePerNight}/night • {hotel.type}
                    </div>
                  )}
                  {hotel.distance && (
                    <div style={{ fontSize: 11, color: "#64748b" }}>{hotel.distance} from center</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {itinerary.hotels.note && (
            <div style={{ fontSize: 11, color: "#0369a1", marginBottom: 8, fontStyle: "italic" }}>
              {itinerary.hotels.note}
            </div>
          )}

          {itinerary.hotels.bookingLinks && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <a
                href={itinerary.hotels.bookingLinks.booking}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 11,
                  backgroundColor: "#0ea5e9",
                  color: "white",
                  padding: "6px 10px",
                  borderRadius: 4,
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                Booking.com
              </a>
              <a
                href={itinerary.hotels.bookingLinks.airbnb}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 11,
                  backgroundColor: "#f43f5e",
                  color: "white",
                  padding: "6px 10px",
                  borderRadius: 4,
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                Airbnb
              </a>
              {itinerary.hotels.bookingLinks.hostelworld && (
                <a
                  href={itinerary.hotels.bookingLinks.hostelworld}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 11,
                    backgroundColor: "#f97316",
                    color: "white",
                    padding: "6px 10px",
                    borderRadius: 4,
                    textDecoration: "none",
                    fontWeight: 500,
                  }}
                >
                  Hostelworld
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
