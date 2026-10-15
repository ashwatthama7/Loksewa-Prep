const {
  MARKS_PER_QUESTION,
  PENALTY_PER_QUESTION,
} = require('../config/constants');

/**
 * Calculate quiz scores from session questions.
 * @param {Array} questions - Array of session question objects with selectedAnswer and the original question
 * @returns {{ correctCount, incorrectCount, unansweredCount, finalScore }}
 */
function calculateScore(questions) {
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  for (const q of questions) {
    if (q.selectedAnswer === null || q.selectedAnswer === undefined) {
      unansweredCount++;
    } else {
      // selectedAnswer is an index into the SHUFFLED options
      // We need to map it back to the original index via shuffledOptionOrder
      const originalIndex = q.shuffledOptionOrder[q.selectedAnswer];
      if (originalIndex === q.question.correctAnswer) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    }
  }

  const rawScore = correctCount * MARKS_PER_QUESTION - incorrectCount * PENALTY_PER_QUESTION;
  const finalScore = Math.max(0, parseFloat(rawScore.toFixed(2)));

  return { correctCount, incorrectCount, unansweredCount, finalScore };
}

module.exports = { calculateScore };
