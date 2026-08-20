const router = require('express').Router();
const { body } = require('express-validator');
const doctorController = require('../controllers/doctor.controller');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', doctorController.list);
router.get('/:id', doctorController.getOne);

router.post(
  '/',
  [body('name').trim().notEmpty().withMessage('Doctor name is required')],
  validate,
  doctorController.create
);

router.put('/:id', doctorController.update);
router.delete('/:id', doctorController.remove);

module.exports = router;
