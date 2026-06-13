const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { groupBalances, memberBalance } = require('../controllers/balance.controller');

const router = Router();
router.use(authenticate);

// GET /api/balances/groups/:groupId
router.get('/groups/:groupId', groupBalances);
// GET /api/balances/groups/:groupId/members/:userId
router.get('/groups/:groupId/members/:userId', memberBalance);

module.exports = router;
