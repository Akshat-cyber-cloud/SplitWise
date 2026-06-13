const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const {
  addMember, removeMember, listMembers,
} = require('../controllers/membership.controller');

const router = Router();
router.use(authenticate);

// /api/memberships/groups/:groupId/members
router.get('/groups/:groupId/members',          listMembers);
router.post('/groups/:groupId/members',         addMember);
router.delete('/groups/:groupId/members/:userId', removeMember);

module.exports = router;
