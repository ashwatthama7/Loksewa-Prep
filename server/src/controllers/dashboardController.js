const QuizSession = require('../models/QuizSession');
const Question = require('../models/Question');
const { SECTIONS_COUNT } = require('../config/constants');

// GET /api/dashboard/stats
exports.getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const sessions = await QuizSession.find(
      { user: userId, status: 'completed' },
      'startedAt completedAt finalScore correctCount incorrectCount unansweredCount'
    ).sort({ startedAt: 1 });

    if (sessions.length === 0) {
      return res.json({
        totalAttempts: 0,
        bestScore: 0,
        averageScore: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        overallAccuracy: 0,
        scoreHistory: [],
        sectionAccuracy: [],
        sessions: [],
      });
    }

    const totalAttempts = sessions.length;
    const scores = sessions.map((s) => s.finalScore);
    const bestScore = Math.max(...scores);
    const averageScore = parseFloat((scores.reduce((a, b) => a + b, 0) / totalAttempts).toFixed(2));
    const totalCorrect = sessions.reduce((a, s) => a + s.correctCount, 0);
    const totalIncorrect = sessions.reduce((a, s) => a + s.incorrectCount, 0);
    const totalAnswered = totalCorrect + totalIncorrect;
    const overallAccuracy = totalAnswered
      ? parseFloat(((totalCorrect / totalAnswered) * 100).toFixed(1))
      : 0;

    const scoreHistory = sessions.map((s) => ({
      date: s.startedAt,
      score: s.finalScore,
      sessionId: s._id,
    }));

    // Section-wise accuracy: requires reviewing completed sessions with populated questions
    const sectionStats = {};
    for (let s = 1; s <= SECTIONS_COUNT; s++) {
      sectionStats[s] = { correct: 0, total: 0 };
    }

    const detailedSessions = await QuizSession.find(
      { user: userId, status: 'completed' },
      'questions'
    ).populate('questions.question', 'section correctAnswer');

    for (const session of detailedSessions) {
      for (const sq of session.questions) {
        if (!sq.question) continue;
        const sec = sq.question.section;
        if (!sectionStats[sec]) continue;
        if (sq.isCorrect !== null) {
          sectionStats[sec].total++;
          if (sq.isCorrect) sectionStats[sec].correct++;
        }
      }
    }

    const sectionAccuracy = [];
    for (let s = 1; s <= SECTIONS_COUNT; s++) {
      const st = sectionStats[s];
      sectionAccuracy.push({
        section: s,
        accuracy: st.total ? parseFloat(((st.correct / st.total) * 100).toFixed(1)) : 0,
        correct: st.correct,
        total: st.total,
      });
    }

    res.json({
      totalAttempts,
      bestScore,
      averageScore,
      totalCorrect,
      totalIncorrect,
      overallAccuracy,
      scoreHistory,
      sectionAccuracy,
      sessions: sessions.map((s) => ({
        _id: s._id,
        startedAt: s.startedAt,
        completedAt: s.completedAt,
        finalScore: s.finalScore,
        correctCount: s.correctCount,
        incorrectCount: s.incorrectCount,
        unansweredCount: s.unansweredCount,
      })),
    });
  } catch (err) {
    next(err);
  }
};
