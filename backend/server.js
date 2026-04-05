import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import Goal from "./models/Goal.js";

const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.get("/", (req, res) => {
  res.send("Mentra AI Backend Running");
});

// route to generate a daily plan based on user input
app.post("/generate-plan", async (req, res) => {
  try {
    const { goal, days } = req.body;

    // Call the OpenRouter API to generate a daily plan based on the user's goal
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3-8b-instruct",
          messages: [
            {
              role: "user",
              content: `
Create a ${days}-day plan for: ${goal}.

Return ONLY valid JSON.

Rules:
- No explanation
- No backticks
- Each day short (max 10 words)
- Do NOT use commas
- MUST be valid JSON
- MUST start with { and end with }

Format:
{
  "day1": "...",
  "day2": "...",
  ...
  "day${days}": "..."
}
`,
            },
          ],
        }),
      },
    );

    const data = await response.json();
    if (data.choices) {
      let text = data.choices[0].message.content.trim();

      let parsed;

      try {
        // handle double-string case
        if (text.startsWith('"') && text.endsWith('"')) {
          text = JSON.parse(text);
        }

        parsed = JSON.parse(text);
      } catch (err) {
        console.log("BAD AI OUTPUT:", text);

        return res.status(500).json({
          error: "AI returned invalid JSON",
          raw: text,
        });
      }

      res.json({
        plan: parsed,
      });
      await Goal.create({ goal, plan: parsed }); // save to DB
    } else {
      console.log("FULL ERROR:", data);
      res.status(500).json({
        error: "AI failed",
        details: data,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.get("/goals", async (req, res) => {
  try {
    const goals = await Goal.find();
    res.json(goals);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch goals" });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
