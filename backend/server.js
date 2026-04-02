import dotenv from "dotenv";
dotenv.config();

import express from "express";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Mentra AI Backend Running");
});

// route to generate a daily plan based on user input
app.post("/generate-plan", async (req, res) => {
  try {
    const { goal } = req.body;

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
              content: `Create a simple daily plan for: ${goal}`,
            },
          ],
        }),
      },
    );

    const data = await response.json();
    if (data.choices) {
      res.json({
        plan: data.choices[0].message.content, // Send the generated plan back to the frontend
      });
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

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
