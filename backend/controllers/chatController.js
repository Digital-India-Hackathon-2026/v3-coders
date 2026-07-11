const fetch = require("node-fetch");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3";

const getSystemPrompt = (userContext, servicesContext) => `You are KisanSeevaBot, a friendly and knowledgeable AI assistant for the KisanSeeva platform — an Indian agricultural services marketplace.

About KisanSeeva:
- KisanSeeva connects local Farmers with Service Providers who offer agricultural machinery on rent (tractors, harvesters, seeders, sprayers, threshers, rotavators, ploughs, etc.)
- Farmers can browse available services, book machinery by the hour, and track providers in real-time using GPS
- Service Providers can list their equipment, manage bookings, and track earnings
- The platform runs Community Pricing Surveys where farmers and providers suggest fair prices per hour for each service type, and admin finalizes the recommended rate
- New users (farmers/providers) must register, upload verification documents (Aadhaar, selfie, driving license) and await admin approval before using the platform

How to help users:
1. For KisanSeeva platform questions: guide them through features, registration, booking, pricing surveys, document upload, admin approval process, etc.
2. For general Indian agriculture questions: provide helpful crops advice (paddy, wheat, cotton, sugarcane, etc.), soil, irrigation, fertilizer advice.
3. Keep responses concise, warm, and respectful. Use Indian farming context.

---
USER SESSION CONTEXT:
${userContext}

---
AVAILABLE MACHINERY SERVICES CURRENTLY LISTED:
${servicesContext}

---
BOOKING SERVICE ASSISTANCE RULES (CRITICAL):
- If the user says they want to book/rent machinery:
  1. Check if the user is a logged-in Farmer (refer to USER SESSION CONTEXT). If not logged in or role is not 'farmer', politely explain that they must be logged in as a Farmer to book a service, and guide them to register or login.
  2. If they are a logged-in Farmer, check if you have the 4 required booking details:
     - Service ID / Service Name (must match one of the AVAILABLE MACHINERY SERVICES list)
     - Booking Date (ask the user for the date if not specified. Accept natural language like "tomorrow", "next Monday" or dates like "July 15th")
     - Hours Required (duration of the booking, must be a number)
     - Farm Location/Address (full text address of their farm)
  3. If any of these 4 details are missing, ask for them politely one by one. Do not ask for all at once to keep it simple.
  4. Once you have gathered all 4 details:
     - Output a response summarizing the booking details.
     - At the very end of your response, append the following exact JSON block tag (ensure it is valid JSON):
       [BOOKING_READY: {"serviceId": SERVICE_ID_NUMBER, "date": "YYYY-MM-DD", "location": "FARM_LOCATION", "hours": HOURS_NUMBER}]
       Replace SERVICE_ID_NUMBER, YYYY-MM-DD, FARM_LOCATION, and HOURS_NUMBER with the actual values you gathered. (Calculate YYYY-MM-DD based on today's date if they say "tomorrow" or similar).
       Example: [BOOKING_READY: {"serviceId": 3, "date": "2026-07-15", "location": "Village Pipariya near Mandi", "hours": 4}]
     - Ask the user to confirm by saying "confirm" or clicking the confirm button.

Keep responses under 200 words. Respond in a warm, helpful tone.`;

const handleChat = async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ message: "Messages array is required." });
  }

  try {
    // 1. Build User Context
    let userContext = `Today's date is: ${new Date().toISOString().split("T")[0]}.\nThe user is a Guest (not logged in). They cannot place bookings.`;
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
        const userRes = await db.query("SELECT name, role FROM users WHERE id = $1", [decoded.id]);
        if (userRes.rows.length > 0) {
          const dbUser = userRes.rows[0];
          userContext = `Today's date is: ${new Date().toISOString().split("T")[0]}.
The user is logged in:
- Name: ${dbUser.name}
- Role: ${dbUser.role} (Only 'farmer' role can book services)
- User ID: ${decoded.id}`;
        }
      } catch (err) {
        // Ignore invalid token, treat as guest
      }
    }

    // 2. Build Services Context
    const servicesRes = await db.query(`
      SELECT s.id, s.name, s.type, s.price_per_hour, u.name as provider_name 
      FROM services s 
      JOIN users u ON s.provider_id = u.id 
      WHERE s.status = 'available'
    `);
    
    let servicesContext = "";
    if (servicesRes.rows.length === 0) {
      servicesContext = "No services are currently listed as available on the platform.";
    } else {
      servicesContext = servicesRes.rows.map(s => 
        `- ID ${s.id}: ${s.name} (${s.type}) by ${s.provider_name} - ₹${parseFloat(s.price_per_hour).toFixed(2)}/hour`
      ).join("\n");
    }

    // 3. Build Full Messages with Dynamic Prompt
    const dynamicPrompt = getSystemPrompt(userContext, servicesContext);
    const fullMessages = [
      { role: "system", content: dynamicPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: fullMessages,
        stream: false,
      }),
    });

    if (!ollamaRes.ok) {
      const errText = await ollamaRes.text();
      console.error("Ollama Error Response:", errText);
      return res.status(502).json({
        message: "Ollama service error. Make sure Ollama is running with `ollama serve` and a model is pulled.",
        error: errText,
      });
    }

    const data = await ollamaRes.json();
    const reply = data?.message?.content || "Sorry, I could not generate a response.";

    res.json({ reply });
  } catch (error) {
    console.error("Chat Controller Error:", error.message);
    if (error.code === "ECONNREFUSED") {
      return res.status(503).json({
        message: "Ollama is not running. Please start it with: ollama serve",
        offline: true,
      });
    }
    res.status(500).json({ message: "Server error processing chat request." });
  }
};

module.exports = { handleChat };

