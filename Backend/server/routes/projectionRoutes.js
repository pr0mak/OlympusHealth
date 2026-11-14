const router = require('express').Router();
const authenticate = require('../middleware/authMiddleware');
const { projection, catalog } = require('../controllers/projectionController');
router.use(authenticate);
router.get('/catalog', catalog);
router.get('/', projection);
router.post('/', projection);
module.exports = router;
