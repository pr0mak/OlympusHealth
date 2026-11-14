const router = require('express').Router();
const { getUserAlerts } = require('../services/alertService');

router.get('/', async (req, res, next) => {
  try {
    const data = await getUserAlerts(req.user.id);
    res.json({ success: true, ...data, notice: 'Rule-based screening, not medical diagnosis. Thresholds require clinical validation.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
