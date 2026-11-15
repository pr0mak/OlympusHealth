const express = require("express");
const router = express.Router();

const {
  getMeasurements
} = require("../controllers/RadiationController");

router.get("/", getMeasurements);

module.exports = router;
