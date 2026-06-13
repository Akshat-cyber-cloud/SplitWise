const { Router } = require('express');
const { register, login, me, listUsers, updateProfile } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = Router();

router.post('/register', register);
router.post('/login',    login);
router.get('/me',        authenticate, me);
router.get('/users',     authenticate, listUsers);
router.put('/profile',   authenticate, updateProfile);

module.exports = router;
