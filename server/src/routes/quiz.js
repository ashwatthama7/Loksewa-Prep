const express = require('express');
const auth = require('../middleware/auth');
const {
  startQuiz,
  getCurrentSession,
  saveAnswer,
  submitQuiz,
  getHistory,
  reviewSession,
} = require('../controllers/quizController');

const router = express.Router();

router.post('/start', auth, startQuiz);
router.get('/current', auth, getCurrentSession);
router.put('/answer', auth, saveAnswer);
router.post('/submit', auth, submitQuiz);
router.get('/history', auth, getHistory);
router.get('/:sessionId/review', auth, reviewSession);

module.exports = router;
