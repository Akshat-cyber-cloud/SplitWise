const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const {
  recordPayment, listPayments,
} = require('../controllers/payment.controller');

const router = Router();
router.use(authenticate);

router.get('/groups/:groupId',  listPayments);
router.post('/groups/:groupId', recordPayment);

module.exports = router;
