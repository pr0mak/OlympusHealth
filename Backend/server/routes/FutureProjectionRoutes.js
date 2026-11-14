
const router = require("express").Router();

const {
  getMetrics,
  getHistory,
  generateMpc,
  forecast,
  generateExerciseImpact
} = require("../controllers/FutureProjectionController");

router.get("/metrics", getMetrics);
router.get("/history", getHistory);

router.post("/mpc", generateMpc);
router.post("/forecast", forecast);
router.post("/exercise-impact", generateExerciseImpact);

module.exports = router;
