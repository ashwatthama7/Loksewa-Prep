const express = require('express');
const { body } = require('express-validator');
const multer = require('multer');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');
const {
  getStats,
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  bulkUpload,
} = require('../controllers/adminController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// All admin routes require auth + admin role
router.use(auth, requireRole('admin'));

const questionValidation = [
  body('section').isInt({ min: 1, max: 10 }).withMessage('Section must be 1-10'),
  body('questionText').trim().isLength({ min: 5 }).withMessage('Question text required (min 5 chars)'),
  body('options').isArray({ min: 4, max: 4 }).withMessage('Must have exactly 4 options'),
  body('options.*').trim().notEmpty().withMessage('All options must be non-empty'),
  body('correctAnswer').isInt({ min: 0, max: 3 }).withMessage('correctAnswer must be 0-3'),
];

router.get('/stats', getStats);
router.get('/questions', getQuestions);
router.post('/questions', questionValidation, createQuestion);
router.put('/questions/:id', questionValidation, updateQuestion);
router.delete('/questions/:id', deleteQuestion);
router.post('/questions/bulk', upload.single('file'), bulkUpload);

module.exports = router;
