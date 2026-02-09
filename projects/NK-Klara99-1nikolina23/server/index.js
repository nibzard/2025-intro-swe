import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "Server running ✅" });
});

// ===== GEOCODING HELPER =====
async function geocodeCity(cityName) {
  if (!process.env.GEOAPIFY_API_KEY) return null;
  
  try {
    const response = await axios.get("https://api.geoapify.com/v1/geocode/search", {
      params: {
        text: cityName,
        type: "city",
        limit: 1,
        apiKey: process.env.GEOAPIFY_API_KEY,
      },
    });
    
    const result = response.data.features?.[0];
    if (result) {
      return {
        lat: result.properties.lat,
        lng: result.properties.lon,
      };
    }
    return null;
  } catch (err) {
    console.error("Geocoding error:", err.message);
    return null;
  }
}

// ===== PLACES API (Geoapify) =====
app.get("/api/places", async (req, res) => {
  try {
    const { destination, type = "restaurant", limit = 10 } = req.query;

    if (!destination) {
      return res.status(400).json({ error: "Destination required" });
    }

    if (!process.env.GEOAPIFY_API_KEY) {
      // Return mock data if no API key
      return res.json({
        destination,
        type,
        places: [
          { name: "Local Restaurant 1", type: "restaurant", address: "City Center" },
          { name: "Local Restaurant 2", type: "restaurant", address: "Old Town" },
        ],
        note: "Sample data - add GEOAPIFY_API_KEY for real results"
      });
    }

    // First geocode the city to get coordinates
    const coords = await geocodeCity(destination);
    if (!coords) {
      return res.json({
        destination,
        type,
        places: [],
        error: "Could not find location coordinates"
      });
    }

    const response = await axios.get("https://api.geoapify.com/v2/places", {
      params: {
        categories: type === "restaurant" ? "catering.restaurant" : type === "museum" ? "tourism.museum" : "tourism.attraction",
        filter: `circle:${coords.lng},${coords.lat},5000`,
        limit,
        apiKey: process.env.GEOAPIFY_API_KEY,
      },
    });

    const places = response.data.features.map((feature) => ({
      name: feature.properties.name,
      type: feature.properties.categories?.[0] || type,
      address: feature.properties.formatted || "Address not available",
      lat: feature.geometry.coordinates[1],
      lng: feature.geometry.coordinates[0],
    }));

    res.json({ destination, type, places });
  } catch (err) {
    console.error("Places API error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ===== FLIGHTS ESTIMATOR =====
app.get("/api/flights", async (req, res) => {
  try {
    const { origin, destination, startDate, endDate, people = 1 } = req.query;

    if (!origin || !destination) {
      return res.status(400).json({ error: "Origin and destination required" });
    }

    // Simple estimate formula
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.max(1, Math.abs(end - start) / (1000 * 60 * 60 * 24));

    const basePrice = 150; // Base flight cost
    const pricePerDay = 25; // Additional cost for longer trips
    const peakSeasonMultiplier = 1.2; // Peak season (summer)
    const estimate = Math.round((basePrice + days * pricePerDay) * peakSeasonMultiplier);

    res.json({
      route: `${origin} → ${destination}`,
      days: Math.round(days),
      estimatedPricePerPerson: estimate,
      totalEstimate: estimate * people,
      currency: "EUR",
      disclaimer: "This is an estimate. Actual prices vary by season, airline, and booking time.",
      searchLinks: {
        googleFlights: `https://www.google.com/flights?hl=en#search;f=${origin};t=${destination};d=${startDate};r=${endDate}`,
        skyscanner: `https://www.skyscanner.com/transport/flights/${origin}/${destination}/${startDate}/?adults=${people}`,
        kayak: `https://www.kayak.com/flights/${origin}-${destination}/${startDate}/${endDate}?fs=1&travelers=${people}`,
      },
    });
  } catch (err) {
    console.error("Flights API error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ===== VIDEOS API (YouTube) =====
app.get("/api/videos", async (req, res) => {
  try {
    const { destination, limit = 5 } = req.query;

    if (!destination) {
      return res.status(400).json({ error: "Destination required" });
    }

    if (!process.env.YOUTUBE_API_KEY) {
      return res.status(500).json({ error: "YOUTUBE_API_KEY not configured" });
    }

    const response = await axios.get("https://www.googleapis.com/youtube/v3/search", {
      params: {
        q: `${destination} travel vlog guide`,
        part: "snippet",
        type: "video",
        maxResults: limit,
        order: "relevance",
        videoEmbeddable: true,
        apiKey: process.env.YOUTUBE_API_KEY,
      },
    });

    const videos = response.data.items.map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium.url,
      channel: item.snippet.channelTitle,
      embedUrl: `https://www.youtube.com/embed/${item.id.videoId}`,
      watchUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }));

    res.json({ destination, videos });
  } catch (err) {
    console.error("Videos API error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ===== HOTELS API (Amadeus) =====
let amadeusToken = null;
let amadeusTokenExpiry = 0;

async function getAmadeusToken() {
  // Check if we have a valid token
  if (amadeusToken && Date.now() < amadeusTokenExpiry) {
    return amadeusToken;
  }

  if (!process.env.AMADEUS_API_KEY || !process.env.AMADEUS_API_SECRET) {
    return null;
  }

  try {
    const response = await axios.post(
      "https://test.api.amadeus.com/v1/security/oauth2/token",
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.AMADEUS_API_KEY,
        client_secret: process.env.AMADEUS_API_SECRET,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    amadeusToken = response.data.access_token;
    amadeusTokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;
    return amadeusToken;
  } catch (err) {
    console.error("Amadeus auth error:", err.message);
    return null;
  }
}

app.get("/api/hotels", async (req, res) => {
  try {
    const { destination, checkIn, checkOut, guests = 1 } = req.query;

    if (!destination) {
      return res.status(400).json({ error: "Destination required" });
    }

    const token = await getAmadeusToken();
    if (!token) {
      // Return mock data if no API key
      return res.json({
        destination,
        hotels: [
          { name: "City Center Hotel", rating: 4, pricePerNight: 85, currency: "EUR", type: "Hotel" },
          { name: "Old Town Apartments", rating: 4.5, pricePerNight: 65, currency: "EUR", type: "Apartment" },
          { name: "Budget Hostel", rating: 3.5, pricePerNight: 25, currency: "EUR", type: "Hostel" },
        ],
        note: "Sample hotels - add AMADEUS_API_KEY for real results",
        bookingLinks: {
          booking: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(destination)}`,
          airbnb: `https://www.airbnb.com/s/${encodeURIComponent(destination)}/homes`,
          hostelworld: `https://www.hostelworld.com/s?q=${encodeURIComponent(destination)}`,
        }
      });
    }

    // First, get city code using the City Search API
    // Keyword must be 3-10 characters
    let cityCode = null;
    let cityGeoCode = null;
    const searchKeyword = destination.trim().substring(0, 10);
    
    if (searchKeyword.length >= 3) {
      try {
        const cityResponse = await axios.get(
          "https://test.api.amadeus.com/v1/reference-data/locations/cities",
          {
            params: { keyword: searchKeyword },
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const cityData = cityResponse.data.data?.[0];
        cityCode = cityData?.iataCode;
        cityGeoCode = cityData?.geoCode;
        console.log(`Found city: ${destination} -> ${cityCode}`);
      } catch (cityErr) {
        console.error("City Search API error:", cityErr.response?.data?.errors?.[0]?.detail || cityErr.message);
      }
    } else {
      console.log("Keyword too short for city search:", searchKeyword);
    }

    if (!cityCode) {
      // Fallback: return mock data with booking links
      return res.json({
        destination,
        hotels: [
          { name: "City Center Hotel", rating: 4, pricePerNight: 85, currency: "EUR", type: "Hotel" },
          { name: "Old Town Apartments", rating: 4.5, pricePerNight: 65, currency: "EUR", type: "Apartment" },
        ],
        note: "Could not find city code - showing sample hotels",
        bookingLinks: {
          booking: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(destination)}`,
          airbnb: `https://www.airbnb.com/s/${encodeURIComponent(destination)}/homes`,
          hostelworld: `https://www.hostelworld.com/s?q=${encodeURIComponent(destination)}`,
        }
      });
    }

    // Get hotel list by city code
    let hotels = [];
    try {
      const hotelsResponse = await axios.get(
        "https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city",
        {
          params: { cityCode },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      hotels = hotelsResponse.data.data?.slice(0, 5).map((h) => ({
        name: h.name,
        hotelId: h.hotelId,
        distance: h.distance?.value ? `${h.distance.value} ${h.distance.unit}` : null,
      })) || [];
    } catch (hotelErr) {
      console.error("Hotel list error:", hotelErr.response?.data || hotelErr.message);
    }

    // Build booking links (handle undefined dates gracefully)
    const bookingLinks = {
      booking: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(destination)}${checkIn ? `&checkin=${checkIn}` : ""}${checkOut ? `&checkout=${checkOut}` : ""}`,
      airbnb: `https://www.airbnb.com/s/${encodeURIComponent(destination)}/homes${checkIn ? `?checkin=${checkIn}` : ""}${checkOut ? `&checkout=${checkOut}` : ""}${guests ? `&guests=${guests}` : ""}`,
      hostelworld: `https://www.hostelworld.com/s?q=${encodeURIComponent(destination)}${checkIn ? `&date_from=${checkIn}` : ""}${checkOut ? `&date_to=${checkOut}` : ""}`,
    };

    res.json({
      destination,
      cityCode,
      hotels,
      bookingLinks,
    });
  } catch (err) {
    console.error("Hotels API error:", err.response?.data || err.message);
    // Return fallback on error
    res.json({
      destination,
      hotels: [
        { name: "City Center Hotel", rating: 4, pricePerNight: 85, currency: "EUR", type: "Hotel" },
      ],
      note: "Error fetching hotels - showing sample data",
      bookingLinks: {
        booking: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(destination)}`,
        airbnb: `https://www.airbnb.com/s/${encodeURIComponent(destination)}/homes`,
      }
    });
  }
});

// ===== COMBINED ENRICHMENT =====
app.get("/api/enrich", async (req, res) => {
  try {
    const { destination, origin, startDate, endDate, people = 1 } = req.query;

    if (!destination) {
      return res.status(400).json({ error: "Destination required" });
    }

    // Fetch all data in parallel
    const [placesRes, flightsRes, videosRes, hotelsRes] = await Promise.allSettled([
      axios.get(`http://localhost:${PORT}/api/places?destination=${destination}&type=restaurant&limit=5`),
      axios.get(
        `http://localhost:${PORT}/api/flights?origin=${origin}&destination=${destination}&startDate=${startDate}&endDate=${endDate}&people=${people}`
      ),
      axios.get(`http://localhost:${PORT}/api/videos?destination=${destination}&limit=3`),
      axios.get(`http://localhost:${PORT}/api/hotels?destination=${destination}&checkIn=${startDate}&checkOut=${endDate}&guests=${people}`),
    ]);

    const enriched = {
      destination,
      places: placesRes.status === "fulfilled" ? placesRes.value.data.places : null,
      flights: flightsRes.status === "fulfilled" ? flightsRes.value.data : null,
      videos: videosRes.status === "fulfilled" ? videosRes.value.data.videos : null,
      hotels: hotelsRes.status === "fulfilled" ? hotelsRes.value.data : null,
    };

    res.json(enriched);
  } catch (err) {
    console.error("Enrichment error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ===== WEB SEARCH HELPER =====
async function searchWeb(query) {
  if (!process.env.TAVILY_API_KEY) {
    return null;
  }
  
  try {
    const response = await axios.post(
      "https://api.tavily.com/search",
      {
        api_key: process.env.TAVILY_API_KEY,
        query: query,
        search_depth: "basic",
        max_results: 3,
        include_answer: true,
      }
    );
    
    return {
      answer: response.data.answer,
      results: response.data.results?.map(r => ({
        title: r.title,
        snippet: r.content?.substring(0, 200),
        url: r.url
      }))
    };
  } catch (err) {
    console.error("Tavily search error:", err.message);
    return null;
  }
}

// ===== CHAT API (Groq) =====
app.post("/api/chat", async (req, res) => {
  try {
    const { tripId, userText, preferences = {}, recentMessages = [] } = req.body;

    if (!userText) {
      return res.status(400).json({ error: "userText is required" });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: "GROQ_API_KEY not configured" });
    }

    const currentYear = new Date().getFullYear();
    
    const systemPrompt = `You are a friendly and knowledgeable travel planning assistant. You help users plan trips AND answer general travel questions.

## YOUR CAPABILITIES:
1. **Trip Planning**: Extract trip details and help users plan itineraries
2. **Travel Advice**: Answer questions about destinations, best times to visit, local tips, etc.
3. **Recommendations**: Suggest specific places, restaurants, cafes, attractions, activities based on preferences

## TRIP DETAILS TO EXTRACT:
- origin: Starting city/location
- destination: Where they want to go  
- startDate: Trip start date (ALWAYS use YYYY-MM-DD format, assume year ${currentYear} or ${currentYear + 1} if not specified)
- endDate: Trip end date (YYYY-MM-DD format)
- budget: Total budget as a number
- currency: Currency code (EUR, USD, GBP, etc. - default: EUR)
- people: Number of travelers (default: 1)
- style: One of: budget, standard, luxury, adventure (default: standard)

## DATE PARSING RULES (IMPORTANT):
- "10-14.3" means March 10 to March 14 → startDate: "${currentYear}-03-10", endDate: "${currentYear}-03-14"
- "15.5-23.5" means May 15 to May 23 → startDate: "${currentYear}-05-15", endDate: "${currentYear}-05-23"
- "March 10-14" → startDate: "${currentYear}-03-10", endDate: "${currentYear}-03-14"
- "10-14 March" → same as above
- European format: day.month (e.g., 10.3 = March 10)

## CURRENT KNOWN PREFERENCES:
${JSON.stringify(preferences)}

## GUIDELINES:
1. Be conversational, helpful, and enthusiastic about travel!
2. If user asks a general question (like "best time to visit Madrid"), answer it directly - don't just extract trip data
3. If planning a trip and info is missing, ask for ONE piece at a time (prioritize: destination → dates → budget)
4. **IMPORTANT**: Set shouldGenerateItinerary: true when you have destination AND dates (startDate AND endDate). The app will generate a visual itinerary with PDF download - do NOT write the itinerary yourself in assistantText!
5. When shouldGenerateItinerary is true, just write a brief message like "Great! I've created your itinerary for [destination]. Check it out below and download the PDF!"
6. If style is not specified, default to "standard"
7. Set needsWebSearch: true if the question requires current/factual info you don't know
8. When recommending or when user mentions specific places (restaurants, cafes, attractions, museums, etc.), add them to the "places" array
9. Always try to recommend real, specific places with their actual names when possible

## RESPONSE FORMAT (valid JSON only):
{
  "assistantText": "Your friendly, helpful response",
  "preferencesPatch": {
    "origin": "city or null",
    "destination": "city or null",
    "startDate": "YYYY-MM-DD or null",
    "endDate": "YYYY-MM-DD or null",
    "budget": number or null,
    "currency": "EUR",
    "people": number or null,
    "style": "standard"
  },
  "places": [
    {"name": "Place Name", "type": "restaurant|cafe|attraction|museum|bar|park|landmark", "description": "Brief description"},
  ],
  "missing": ["fields still needed for itinerary"],
  "shouldGenerateItinerary": false,
  "suggestedTitle": "Destination Trip" or null,
  "needsWebSearch": false,
  "searchQuery": "optional search query if needsWebSearch is true"
}

Note: The "places" array should contain specific places you recommend OR that the user mentions wanting to visit. Include real place names when possible.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...recentMessages.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: "user", content: userText },
    ];

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages,
        temperature: 0.7,
        max_tokens: 1024,
        response_format: { type: "json_object" },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const content = response.data.choices[0]?.message?.content;
    let parsed;

    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {
        assistantText: content || "I'd be happy to help you plan your trip! Where would you like to go?",
        preferencesPatch: {},
        missing: ["destination", "startDate", "endDate"],
        shouldGenerateItinerary: false,
        suggestedTitle: null,
        needsWebSearch: false,
      };
    }

    // If LLM requested web search, perform it and generate a new response
    if (parsed.needsWebSearch && parsed.searchQuery) {
      const searchResults = await searchWeb(parsed.searchQuery);
      
      if (searchResults) {
        // Call LLM again with search results
        const searchContext = `
Web search results for "${parsed.searchQuery}":
${searchResults.answer ? `Summary: ${searchResults.answer}` : ''}
${searchResults.results?.map(r => `- ${r.title}: ${r.snippet}`).join('\n') || ''}
`;
        
        const followUpMessages = [
          ...messages,
          { role: "assistant", content: JSON.stringify(parsed) },
          { role: "user", content: `Here are web search results to help answer the question:\n${searchContext}\n\nPlease provide a helpful response based on this information.` }
        ];
        
        const followUpResponse = await axios.post(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            model: "llama-3.3-70b-versatile",
            messages: followUpMessages,
            temperature: 0.7,
            max_tokens: 1024,
            response_format: { type: "json_object" },
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
              "Content-Type": "application/json",
            },
          }
        );
        
        try {
          const followUpContent = followUpResponse.data.choices[0]?.message?.content;
          parsed = JSON.parse(followUpContent);
        } catch {
          // Keep original parsed response if follow-up fails
        }
      }
    }

    // Always generate a title if we have a destination
    const destination = parsed.preferencesPatch?.destination;
    let suggestedTitle = parsed.suggestedTitle;
    
    if (!suggestedTitle && destination) {
      // Auto-generate title from destination
      suggestedTitle = `${destination} Trip`;
    }
    
    const chatResponse = {
      tripId,
      assistantText: parsed.assistantText,
      preferencesPatch: parsed.preferencesPatch || {},
      places: parsed.places || [],
      missing: parsed.missing || [],
      shouldGenerateItinerary: parsed.shouldGenerateItinerary || false,
      suggestedTitle,
    };
    
    // Log for debugging
    console.log("Chat response:", { 
      destination, 
      suggestedTitle,
      shouldGenerateItinerary: chatResponse.shouldGenerateItinerary
    });
    
    res.json(chatResponse);
  } catch (err) {
    console.error("Chat API error:", err.response?.data || err.message);
    res.json({
      assistantText: "I'm having trouble processing your request right now. Could you please try again?",
      preferencesPatch: {},
      places: [],
      missing: [],
      shouldGenerateItinerary: false,
      suggestedTitle: null,
    });
  }
});

// Error handler
app.use((err, req, res) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`✅ Travel Planner Server running on http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});
