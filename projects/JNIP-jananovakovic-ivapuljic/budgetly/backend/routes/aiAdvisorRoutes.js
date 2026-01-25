const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getFinancialAdvice, getQuickInsights } = require("../controllers/aiAdvisorController");

const router = express.Router();

router.post("/chat", protect, getFinancialAdvice);
router.get("/insights", protect, getQuickInsights);

module.exports = router;
