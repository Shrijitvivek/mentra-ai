import axios from "axios";

export const getEmbedding = async (text) => {
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/embeddings",
      {
        model: "openai/text-embedding-3-small",
        input: text,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
      }
    );

    console.log("EMBEDDING RESPONSE:", response.data);

    return response.data.data[0].embedding;
  } catch (err) {
    console.log("EMBEDDING ERROR:", err.response?.data || err.message);
    throw err;
  }
};