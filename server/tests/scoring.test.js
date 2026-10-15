const { calculateScore } = require('../src/utils/scoring');
const {
  MARKS_PER_QUESTION,
  PENALTY_PER_QUESTION,
} = require('../src/config/constants');

// Helper to build a mock session question
function makeQ(shuffledOptionOrder, selectedAnswer, correctAnswer) {
  return {
    shuffledOptionOrder,
    selectedAnswer,
    question: { correctAnswer },
  };
}

describe('calculateScore', () => {
  test('all correct answers gives full score', () => {
    // 5 questions, each selected answer maps back to correctAnswer
    const questions = [
      makeQ([0, 1, 2, 3], 0, 0), // selectedAnswer 0 → original 0 ✓
      makeQ([1, 0, 2, 3], 1, 0), // selectedAnswer 1 → original 0 ✓
      makeQ([2, 1, 0, 3], 2, 0), // selectedAnswer 2 → original 0 ✓
      makeQ([3, 1, 2, 0], 3, 0), // selectedAnswer 3 → original 0 ✓
      makeQ([0, 1, 2, 3], 0, 0), // selectedAnswer 0 → original 0 ✓
    ];
    const result = calculateScore(questions);
    expect(result.correctCount).toBe(5);
    expect(result.incorrectCount).toBe(0);
    expect(result.unansweredCount).toBe(0);
    expect(result.finalScore).toBe(5 * MARKS_PER_QUESTION);
  });

  test('all wrong answers deducts penalty and never goes below 0', () => {
    const questions = [
      makeQ([0, 1, 2, 3], 1, 0), // wrong
      makeQ([0, 1, 2, 3], 2, 0), // wrong
      makeQ([0, 1, 2, 3], 3, 0), // wrong
    ];
    const result = calculateScore(questions);
    expect(result.correctCount).toBe(0);
    expect(result.incorrectCount).toBe(3);
    expect(result.finalScore).toBe(0); // clamped to 0
  });

  test('unanswered questions give 0 marks', () => {
    const questions = [
      makeQ([0, 1, 2, 3], null, 0),
      makeQ([0, 1, 2, 3], null, 1),
    ];
    const result = calculateScore(questions);
    expect(result.unansweredCount).toBe(2);
    expect(result.finalScore).toBe(0);
  });

  test('mixed scenario: 3 correct, 2 wrong, 1 unanswered', () => {
    const questions = [
      makeQ([0, 1, 2, 3], 0, 0), // correct
      makeQ([0, 1, 2, 3], 0, 0), // correct
      makeQ([0, 1, 2, 3], 0, 0), // correct
      makeQ([0, 1, 2, 3], 1, 0), // wrong
      makeQ([0, 1, 2, 3], 2, 0), // wrong
      makeQ([0, 1, 2, 3], null, 0), // unanswered
    ];
    const result = calculateScore(questions);
    expect(result.correctCount).toBe(3);
    expect(result.incorrectCount).toBe(2);
    expect(result.unansweredCount).toBe(1);
    const expected = parseFloat((3 * MARKS_PER_QUESTION - 2 * PENALTY_PER_QUESTION).toFixed(2));
    expect(result.finalScore).toBe(expected);
  });

  test('penalty does not take score below 0', () => {
    // 1 correct, 10 wrong => 1 - 10*0.2 = -1 → clamped to 0
    const questions = [
      makeQ([0, 1, 2, 3], 0, 0), // correct
      ...Array(10).fill(null).map(() => makeQ([0, 1, 2, 3], 1, 0)), // wrong
    ];
    const result = calculateScore(questions);
    expect(result.finalScore).toBe(0);
  });

  test('handles shuffled option order correctly', () => {
    // options = ['A','B','C','D'], correctAnswer = 2 (C)
    // shuffledOptionOrder = [2, 0, 1, 3] → shuffled options = ['C','A','B','D']
    // selectedAnswer = 0 → maps to original index 2 → correct
    const q = makeQ([2, 0, 1, 3], 0, 2);
    const result = calculateScore([q]);
    expect(result.correctCount).toBe(1);
  });

  test('empty questions array returns zeros', () => {
    const result = calculateScore([]);
    expect(result.correctCount).toBe(0);
    expect(result.incorrectCount).toBe(0);
    expect(result.unansweredCount).toBe(0);
    expect(result.finalScore).toBe(0);
  });
});
