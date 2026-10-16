const mongoose = require('mongoose');
const { SECTIONS_COUNT } = require('../config/constants');

// Auto-generate questionId like Q-0001
async function generateQuestionId() {
  const last = await mongoose.model('Question').findOne(
    { questionId: { $regex: /^Q-\d+$/ } },
    { questionId: 1 }
  ).sort({ questionId: -1 });

  if (!last || !last.questionId) {
    const count = await mongoose.model('Question').countDocuments();
    return `Q-${String(count + 1).padStart(4, '0')}`;
  }

  const match = last.questionId.match(/^Q-(\d+)$/);
  const num = match ? parseInt(match[1], 10) : 0;
  return `Q-${String(num + 1).padStart(4, '0')}`;
}

const questionSchema = new mongoose.Schema(
  {
    questionId: {
      type: String,
      unique: true,
      sparse: true, // allows documents without questionId or legacy items without collision
      trim: true,
    },
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
module.exports.generateQuestionId = generateQuestionId;
