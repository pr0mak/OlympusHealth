const {
  getRadiationMeasurements
} = require("../models/RadiationModel");

async function getMeasurements(req, res, next) {
  try {
    const measurements = await getRadiationMeasurements(
      req.user.id
    );

    return res.status(200).json({
      success: true,
      data: measurements
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMeasurements
};
