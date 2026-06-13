const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const {
  createGroup, listGroups, getGroup, updateGroup, deleteGroup,
} = require('../controllers/group.controller');

const router = Router();
router.use(authenticate);

router.get('/',     listGroups);
router.post('/',    createGroup);
router.get('/:id',  getGroup);
router.put('/:id',  updateGroup);
router.delete('/:id', deleteGroup);

module.exports = router;
