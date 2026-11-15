const {
  getMuscle,
  getBone,
  getOrgan,
} = require("../models/AnatomyModel");

function handler(loader) {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const regionKey =
        req.params.regionKey || req.params.organKey;

      const data = await loader(userId, regionKey);

      if (data === undefined) {
        return res.status(404).json({
          success: false,
          message: "Unknown anatomy region",
        });
      }

      if (data === null) {
        return res.status(404).json({
          success: false,
          message: "No measurements for this region and user",
        });
      }

      return res.status(200).json({
        success: true,
        data,
      });

    } catch (error) {
      next(error);
    }
  };
}

const getMuscleStatus = handler(getMuscle);
const getBoneStatus = handler(getBone);
const getOrganStatus = handler(getOrgan);

module.exports = {
  getMuscleStatus,
  getBoneStatus,
  getOrganStatus,
};
