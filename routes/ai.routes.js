import express from "express";
import { authorize } from "../middlewares/auth.middleware.js";
import {
    getAIInsights,
    generateDemandForecast,
    generateReorderSuggestions,
    analyzeTrends,
    detectAnomalies,
    dismissInsight,
    implementInsight,
    getInsightsSummary
} from "../controllers/ai.controllers.js";

const aiRouter = express.Router();

// All AI routes require authentication
aiRouter.use(authorize);

// Get AI insights and summary
aiRouter.get("/insights", getAIInsights);
aiRouter.get("/insights/summary", getInsightsSummary);

// AI analysis endpoints
aiRouter.post("/forecast", generateDemandForecast);
aiRouter.post("/reorder-suggestions", generateReorderSuggestions);
aiRouter.get("/trends", analyzeTrends);
aiRouter.post("/anomalies", detectAnomalies);

// Insight management
aiRouter.post("/insights/:insightId/dismiss", dismissInsight);
aiRouter.post("/insights/:insightId/implement", implementInsight);

export default aiRouter;