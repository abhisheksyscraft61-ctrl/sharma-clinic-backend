const router = require('express').Router();
const visitController = require('../controllers/visit.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/:id', visitController.getOne);
router.delete('/:id', visitController.remove);

// Prescription file: open (view/stream) or delete
router.get('/files/:fileId/open', visitController.openFile);
router.delete('/files/:fileId', visitController.removeFile);

module.exports = router;
