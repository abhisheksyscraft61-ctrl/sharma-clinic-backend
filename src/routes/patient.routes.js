const router = require('express').Router();
const { body } = require('express-validator');
const patientController = require('../controllers/patient.controller');
const visitController = require('../controllers/visit.controller');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.use(authenticate);

const patientValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('age').isInt({ min: 0, max: 150 }).withMessage('Valid age is required'),
  body('sex').isIn(['male', 'female', 'other']).withMessage('Sex must be male, female or other'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('registrationNo').trim().notEmpty().withMessage('Registration number is required'),
];

// ---- Patients ----
router.get('/', patientController.list); // ?search=&clinicId=
router.get('/:id', patientController.getOne);
router.post('/', patientValidation, validate, patientController.create);
router.put('/:id', patientController.update);
router.delete('/:id', patientController.remove);

// ---- Doctor assignment (max 10, enforced in repository + DB trigger) ----
router.post(
  '/:id/doctors',
  [
    body('doctorId')
      .custom((value) => {
        const numericId = /^\d+$/.test(String(value));
        const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value));
        if (!numericId && !uuid) throw new Error('Valid doctorId is required');
        return true;
      })
      .withMessage('Valid doctorId is required'),
  ],
  validate,
  patientController.assignDoctor
);
router.delete('/:id/doctors/:doctorId', patientController.unassignDoctor);

// ---- Visits (nested under a patient) ----
router.get('/:patientId/visits', visitController.listForPatient);
router.post(
  '/:patientId/visits',
  upload.array('files', 5),
  [
    body('clinicId')
      .custom((value) => {
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value))) {
          throw new Error('Valid clinicId is required');
        }
        return true;
      })
      .withMessage('Valid clinicId is required'),
    body('visitDate').isISO8601().withMessage('Valid visitDate (YYYY-MM-DD) is required'),
  ],
  validate,
  visitController.create
);

module.exports = router;
