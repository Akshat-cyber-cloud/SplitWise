const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');
const { uploadCSV, getImportReport } = require('../controllers/import.controller');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });
const router = Router();
router.use(authenticate);

// POST /api/import/groups/:groupId  (multipart: file field = "csv")
router.post('/groups/:groupId', upload.single('csv'), uploadCSV);
router.get('/batches/:batchId/report', getImportReport);

module.exports = router;
