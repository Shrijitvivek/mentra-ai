import dotenv from "dotenv";
dotenv.config();
import { Pinecone } from "@pinecone-database/pinecone";
export const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});
export const index = pc.Index(process.env.PINECONE_INDEX_NAME);