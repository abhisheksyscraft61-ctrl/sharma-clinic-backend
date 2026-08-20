const router = require('express').Router();
const { body } = require('express-validator');
const clinicController = require('../controllers/clinic.controller');
const { validate } = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

router.get('/', clinicController.list);
router.get('/:id', clinicController.getOne);

router.post(
  '/',
  requireRole('admin'),
  [body('name').trim().notEmpty().withMessage('Clinic name is required')],
  validate,
  clinicController.create
);

router.put('/:id', requireRole('admin'), clinicController.update);
router.delete('/:id', requireRole('admin'), clinicController.remove);

module.exports = router;
