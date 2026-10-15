const mongoose = require('mongoose');
const { SECTIONS_COUNT } = require('../config/constants');

// Auto-generate questionId like Q-0001
async function generateQuestionId() {
  const last = await mongoose.model('Question').findOne({}, {}, { sort: { createdAt: -1 } });
  if (!last || !last.questionId) return 'Q-0001';
  const num = parseInt(last.questionId.replace('Q-', ''), 10);
  return `Q-${String(num + 1).padStart(4, '0')}`;
}

const questionSchema = new mongoose.Schema(
  {
    questionId: { type: String, unique: true },
    section: {
      type: Number,
      required: true,
      min: 1,
      max: SECTIONS_COUNT,
      index: true,
    },
    questionText: { type: String, required: true, trim: true },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (v) => v.length === 4,
        message: 'options must have exactly 4 items',
      },
    },
    correctAnswer: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
      validate: {
        validator: function (v) {
          return this.options && this.options[v] !== undefined;
        },
        message: 'correctAnswer index must reference a valid option',
      },
    },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

questionSchema.pre('save', async function (next) {
  if (!this.questionId) {
    this.questionId = await generateQuestionId();
  }
  next();
});

module.exports = mongoose.model('Question', questionSchema);
