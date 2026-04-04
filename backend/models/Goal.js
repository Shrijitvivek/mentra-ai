import mongoose from "mongoose";

const goalSchema = new mongoose.Schema({
  goal: { type: String, required: true },
  plan: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Goal = mongoose.model("Goal", goalSchema);

export default Goal;
