const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const multer = require('multer');
const { uploadCSV, getImportReport } = require('../controllers/import.controller');

const upload = multer({ dest: 'uploads/' });
const router = Router();
router.use(authenticate);

// POST /api/import/groups/:groupId  (multipart: file field = "csv")
router.post('/groups/:groupId', upload.single('csv'), uploadCSV);
router.get('/batches/:batchId/report', getImportReport);

module.exports = router;
