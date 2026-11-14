const router = require('express').Router();
const authenticate = require('../middleware/authMiddleware');
const controller = require('../controllers/assistantController');
router.use(authenticate);
router.get('/', controller.status);
router.post('/', controller.recommend);
router.post('/feedback', controller.feedback);
router.post('/demo/train', controller.demoTrain);
module.exports = router;
