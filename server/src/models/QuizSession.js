const mongoose = require('mongoose');

const sessionQuestionSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    shuffledOptionOrder: { type: [Number], required: true }, // e.g. [2,0,3,1] — indices into original options[]
    selectedAnswer: { type: Number, default: null }, // index in the SHUFFLED options (null = unanswered)
    isCorrect: { type: Boolean, default: null },
  },
  { _id: false }
);

const quizSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    questions: { type: [sessionQuestionSchema], required: true },
    status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    correctCount: { type: Number, default: 0 },
    incorrectCount: { type: Number, default: 0 },
    unansweredCount: { type: Number, default: 0 },
    finalScore: { type: Number, default: 0 },
  },
  { timestamps: false }
);

quizSessionSchema.index({ user: 1, status: 1 });
quizSessionSchema.index({ user: 1, startedAt: -1 });

module.exports = mongoose.model('QuizSession', quizSessionSchema);
