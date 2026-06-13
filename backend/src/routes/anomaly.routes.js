const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { listAnomalies, resolveAnomaly } = require('../controllers/anomaly.controller');

const router = Router();
router.use(authenticate);

router.get('/batches/:batchId',       listAnomalies);
router.patch('/:anomalyId/resolve',   resolveAnomaly);

module.exports = router;
