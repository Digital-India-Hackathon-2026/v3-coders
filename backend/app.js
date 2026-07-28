const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const adminRoutes = require("./routes/adminRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const surveyRoutes = require("./routes/surveyRoutes");
const chatRoutes = require("./routes/chatRoutes");
const complaintRoutes = require("./routes/complaintRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/surveys", surveyRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/complaints", complaintRoutes);

const { Readable } = require("stream");

function stripMarkdown(text) {
  if (!text) return "";
  return text
    .replace(/\[BOOKING_READY:.*?\]/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[`#*_~>[\]()|]/g, " ")
    .replace(/^[-•]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

app.get("/api/tts", async (req, res) => {
  try {
    const { text, lang } = req.query;
    if (!text) return res.status(400).send("Missing text");
    const cleanText = stripMarkdown(text).slice(0, 250);
    if (!cleanText) return res.status(400).send("Empty text");

    const targetLang = (lang || "te").split("-")[0];
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=${targetLang}&client=tw-ob`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return res.status(500).send("TTS Upstream Error");
    }

    res.set({
      "Content-Type": "audio/mpeg",
    });

    const nodeStream = Readable.fromWeb(response.body);
    nodeStream.pipe(res);
  } catch (err) {
    console.error("TTS Proxy Error:", err.message);
    res.status(500).send("TTS Proxy Failed");
  }
});

app.get("/", (req, res) => {
    res.send("🚜 Welcome to KisanSeeva API");
});

module.exports = app;