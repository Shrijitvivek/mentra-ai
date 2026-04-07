import express from "express";
import {
  generatePlan,
  getGoals,
  updateTask,
  getFeedback,
} from "../controllers/goalController.js";

const router = express.Router();

router.post("/generate-plan", generatePlan);
router.get("/goals", getGoals);
router.patch("/goals/:id", updateTask);
router.post("/feedback", getFeedback);

export default router;