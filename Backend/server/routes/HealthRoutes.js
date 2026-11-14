
const router = require("express").Router();

const controller = require(
  "../controllers/HealthController"
);

router.get("/", controller.getHealth);

router.get(
  "/measurements",
  controller.getMeasurements
);

router.post(
  "/measurements",
  controller.createMeasurement
);

router.put(
  "/measurements",
  controller.updateMeasurement
);

module.exports = router;
