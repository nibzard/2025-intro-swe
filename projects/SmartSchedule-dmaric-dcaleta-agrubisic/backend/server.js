// backend/server.js

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// test ruta
app.get("/", (req, res) => {
  res.send("Backend radi");
});

// AI ruta gpt-4o-mini
app.post("/ai-generate", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Missing prompt" });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0.3,
      messages: [
        { role: "user", content: prompt }
      ]
    });

    res.json({
      result: completion.choices[0].message.content
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log("Backend sluša na http://localhost:" + PORT);
});