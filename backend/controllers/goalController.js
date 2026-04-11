import Goal from "../models/Goal.js";
import axios from "axios";
import { getEmbedding } from "../utils/embedding.js";
import { index } from "../config/pinecone.js";

export const generatePlan = async (req, res) => {
  try {
    const { goal, days } = req.body;

    const response = await axios.post(
      // make the API call
      "https://openrouter.ai/api/v1/chat/completions", //endpoint for chat completions
      {
        model: "meta-llama/llama-3-8b-instruct",
        messages: [
          {
            role: "user",
            content: `Create a ${days}-day plan for: ${goal}.

Return ONLY valid JSON.

STRICT RULES:
- Each value MUST be a simple string
- NO objects
- NO arrays
- NO explanations
- NO extra text
- Each task max 8 words

Format:
{
 "day1": "simple task",
 "day2": "simple task",
 "day3": "simple task"
}`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    const text = response.data.choices[0].message.content.trim(); // extract the text response

    let parsed;
    try {
      parsed = JSON.parse(text); // attempt to parse the text as JSON
    } catch {
      return res.status(500).json({ error: "Invalid AI JSON" });
    }

    const planArray = Object.entries(parsed).map(([_, value], index) => ({
      // convert the parsed object into an array format
      day: index + 1, // add a day number
      text: String(value), // ensure the task is a string
      done: false,
    }));

    const savedGoal = await Goal.create({ goal, plan: planArray }); // save the goal and plan to the database

    for (let i = 0; i < planArray.length; i++) {
      // loop through each task in the plan

      console.log("Processing task:", planArray[i].text); // log the task text for debugging
      const embedding = await getEmbedding(planArray[i].text); // get the embedding for the task text
      // console.log(
      //   "Embedding for task:",
      //   planArray[i].text,
      //   embedding.slice(0, 5),
      // ); // log the first 5 values of the embedding for debugging

      console.log("embedding length:", embedding.length);
      await axios.post(
        `https://mentra-ai-scky3b7.svc.aped-4627-b74a.pinecone.io/vectors/upsert`,
        {
          vectors: [
            {
              id: `${savedGoal._id}-${i}`,
              values: embedding,
              metadata: {
                goalId: savedGoal._id.toString(),
                day: planArray[i].day,
                text: planArray[i].text,
              },
            },
          ],
        },
        {
          headers: {
            "Api-Key": process.env.PINECONE_API_KEY,
            "Content-Type": "application/json",
          },
        },
      );
    }

    res.json({
      plan: planArray,
      goalId: savedGoal._id,
    });
  } catch (err) {
    console.log("FULL ERROR:", err);
    res.status(500).json({ error: "Failed to generate plan" });
  }
};

export const getGoals = async (req, res) => {
  try {
    const goals = await Goal.find();
    res.json(goals);
  } catch {
    res.status(500).json({ error: "Failed to fetch goals" });
  }
};

export const updateTask = async (req, res) => {
  try {
    const index = Number(req.body.index); // convert the index to a number

    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ error: "Goal not found" });

    goal.plan[index].done = !goal.plan[index].done; // toggle the done status of the specified task
    goal.markModified("plan"); // mark the plan field as modified so Mongoose knows to update it

    await goal.save();

    res.json(goal);
  } catch {
    res.status(500).json({ error: "Failed to update task" });
  }
};

export const getFeedback = async (req, res) => {
  try {
    const { task } = req.body;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "meta-llama/llama-3-8b-instruct",
        messages: [
          {
            role: "user",
            content: `Give very short advice (1 sentence only).
No formatting.

Task: ${task}`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    const text = response.data.choices[0].message.content.trim(); // extract the text response

    res.json({ feedback: text });
  } catch (err) {
    console.log(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to get feedback" });
  }
};
