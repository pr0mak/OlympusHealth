const express = require("express");
const router = express.Router();

const {
  getHealthSummary,
  getMeasurements,
  createMeasurement,
  updateMeasurement
} = require("../controllers/HealthController");

router.get("/", getHealthSummary);

router.get("/measurements", getMeasurements);

router.post("/measurements", createMeasurement);

router.put("/measurements", updateMeasurement);

module.exports = router;