const QuizSession = require('../models/QuizSession');
const Question = require('../models/Question');
const { selectQuestions } = require('../utils/questionSelector');
const { calculateScore } = require('../utils/scoring');
const { TOTAL_QUESTIONS } = require('../config/constants');

// Helper: strip correct answers from questions for in-progress responses
// Expects session.questions[i].question to already be populated
function safeSessionData(session) {
  return {
    _id: session._id,
    status: session.status,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    correctCount: session.correctCount,
    incorrectCount: session.incorrectCount,
    unansweredCount: session.unansweredCount,
    finalScore: session.finalScore,
    questions: session.questions.map((sq, idx) => {
      const q = sq.question;
      if (!q) return null; // guard against un-populated ref
      // Build shuffled options array for client (no correctAnswer)
      const shuffledOptions = sq.shuffledOptionOrder.map((i) => q.options[i]);
      return {
        index: idx,
        questionId: q.questionId,
        section: q.section,
        questionText: q.questionText,
        options: shuffledOptions, // already shuffled, correct answer not revealed
        selectedAnswer: sq.selectedAnswer,
      };
    }).filter(Boolean),
  };
}

// POST /api/quiz/start
exports.startQuiz = async (req, res, next) => {
  try {
    // Check for existing in-progress session
    const existing = await QuizSession.findOne({ user: req.user._id, status: 'in_progress' });
    if (existing) {
      return res.status(400).json({
        message: 'You have an in-progress quiz. Resume it or submit it first.',
        sessionId: existing._id,
      });
    }

    const result = await selectQuestions();
    if (result.error === 'insufficient_questions') {
      return res.status(422).json({
        message: 'Not enough questions to start a quiz.',
        insufficientSections: result.insufficientSections,
      });
    }

    const { sessionQuestions } = result;

    const session = await QuizSession.create({
      user: req.user._id,
      questions: sessionQuestions,
    });

    // Reload with populated questions
    const populated = await QuizSession.findById(session._id).populate('questions.question');
    res.status(201).json(safeSessionData(populated));
  } catch (err) {
    next(err);
  }
};

// GET /api/quiz/current
exports.getCurrentSession = async (req, res, next) => {
  try {
    const session = await QuizSession.findOne({
      user: req.user._id,
      status: 'in_progress',
    }).populate('questions.question');

    if (!session) {
      return res.status(404).json({ message: 'No in-progress session found' });
    }

    res.json(safeSessionData(session));
  } catch (err) {
    next(err);
  }
};

// PUT /api/quiz/answer
exports.saveAnswer = async (req, res, next) => {
  try {
    const { questionIndex, selectedAnswer } = req.body;

    if (
      questionIndex === undefined ||
      selectedAnswer === undefined
    ) {
      return res.status(400).json({ message: 'questionIndex and selectedAnswer are required' });
    }

    if (
      typeof questionIndex !== 'number' ||
      questionIndex < 0 ||
      questionIndex >= TOTAL_QUESTIONS
    ) {
      return res.status(400).json({ message: 'Invalid questionIndex' });
    }

    if (selectedAnswer !== null && (typeof selectedAnswer !== 'number' || selectedAnswer < 0 || selectedAnswer > 3)) {
      return res.status(400).json({ message: 'selectedAnswer must be 0-3 or null' });
    }

    const session = await QuizSession.findOne({ user: req.user._id, status: 'in_progress' });
    if (!session) {
      return res.status(404).json({ message: 'No in-progress session found' });
    }

    session.questions[questionIndex].selectedAnswer = selectedAnswer;
    await session.save();

    res.json({ message: 'Answer saved', questionIndex, selectedAnswer });
  } catch (err) {
    next(err);
  }
};

// POST /api/quiz/submit
exports.submitQuiz = async (req, res, next) => {
  try {
    const session = await QuizSession.findOne({
      user: req.user._id,
      status: 'in_progress',
    }).populate('questions.question');

    if (!session) {
      return res.status(404).json({ message: 'No in-progress session found' });
    }

    // Evaluate answers server-side
    const { correctCount, incorrectCount, unansweredCount, finalScore } =
      calculateScore(session.questions);

    // Mark isCorrect for each question
    session.questions.forEach((sq) => {
      if (sq.selectedAnswer === null || sq.selectedAnswer === undefined) {
        sq.isCorrect = null;
      } else {
        const originalIndex = sq.shuffledOptionOrder[sq.selectedAnswer];
        sq.isCorrect = originalIndex === sq.question.correctAnswer;
      }
    });

    session.status = 'completed';
    session.completedAt = new Date();
    session.correctCount = correctCount;
    session.incorrectCount = incorrectCount;
    session.unansweredCount = unansweredCount;
    session.finalScore = finalScore;
    await session.save();

    res.json({
      message: 'Quiz submitted successfully',
      sessionId: session._id,
      correctCount,
      incorrectCount,
      unansweredCount,
      finalScore,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/quiz/history
exports.getHistory = async (req, res, next) => {
  try {
    const sessions = await QuizSession.find(
      { user: req.user._id, status: 'completed' },
      'startedAt completedAt correctCount incorrectCount unansweredCount finalScore'
    ).sort({ startedAt: -1 });

    res.json(sessions);
  } catch (err) {
    next(err);
  }
};

// GET /api/quiz/:sessionId/review
exports.reviewSession = async (req, res, next) => {
  try {
    const session = await QuizSession.findOne({
      _id: req.params.sessionId,
      user: req.user._id,
      status: 'completed',
    }).populate('questions.question');

    if (!session) {
      return res.status(404).json({ message: 'Session not found or not completed' });
    }

    const review = session.questions.map((sq, idx) => {
      const q = sq.question;
      const shuffledOptions = sq.shuffledOptionOrder.map((i) => q.options[i]);
      // Find the correct answer index in the shuffled array
      const correctShuffledIndex = sq.shuffledOptionOrder.indexOf(q.correctAnswer);

      return {
        index: idx,
        questionId: q.questionId,
        section: q.section,
        questionText: q.questionText,
        options: shuffledOptions,
        selectedAnswer: sq.selectedAnswer,
        correctAnswer: correctShuffledIndex, // reveal correct answer in review
        isCorrect: sq.isCorrect,
      };
    });

    res.json({
      sessionId: session._id,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      correctCount: session.correctCount,
      incorrectCount: session.incorrectCount,
      unansweredCount: session.unansweredCount,
      finalScore: session.finalScore,
      questions: review,
    });
  } catch (err) {
    next(err);
  }
};
