const express = require("express");
const router = express.Router();

const HealthController = require("../controllers/HealthController");

router.get("/", HealthController.getHealth);

router.get("/measurements", HealthController.getMeasurements);

router.post("/measurements", HealthController.createMeasurement);

router.put("/measurements", HealthController.updateMeasurement);

module.exports = router;
