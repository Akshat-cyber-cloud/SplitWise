const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const {
  createExpense, listExpenses, getExpense, updateExpense, deleteExpense, getRate,
} = require('../controllers/expense.controller');

const router = Router();
router.use(authenticate);

router.get('/exchange-rate',        getRate);
router.get('/groups/:groupId',     listExpenses);
router.post('/groups/:groupId',    createExpense);
router.get('/:id',                 getExpense);
router.put('/:id',                 updateExpense);
router.delete('/:id',              deleteExpense);

module.exports = router;
