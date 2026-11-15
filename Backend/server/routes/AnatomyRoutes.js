const express = require("express");
const router = express.Router();

const {
  getMuscleStatus,
  getBoneStatus,
  getOrganStatus,
} = require("../controllers/AnatomyController");

router.get("/muscles/:regionKey", getMuscleStatus);
router.get("/bones/:regionKey", getBoneStatus);
router.get("/organs/:organKey", getOrganStatus);

module.exports = router;