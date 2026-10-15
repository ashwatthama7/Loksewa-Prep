const Question = require('../models/Question');
const { SECTIONS_COUNT, QUESTIONS_PER_SECTION } = require('../config/constants');

/**
 * Fisher-Yates shuffle
 */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Select QUESTIONS_PER_SECTION random questions from each section using $sample.
 * Returns null if any section has fewer than QUESTIONS_PER_SECTION questions.
 */
async function selectQuestions() {
  const sectionCounts = await Question.aggregate([
    { $group: { _id: '$section', count: { $sum: 1 } } },
  ]);

  const countMap = {};
  for (const s of sectionCounts) {
    countMap[s._id] = s.count;
  }

  const insufficientSections = [];
  for (let s = 1; s <= SECTIONS_COUNT; s++) {
    if ((countMap[s] || 0) < QUESTIONS_PER_SECTION) {
      insufficientSections.push({ section: s, count: countMap[s] || 0 });
    }
  }

  if (insufficientSections.length > 0) {
    return { error: 'insufficient_questions', insufficientSections };
  }

  // Sample per section in parallel
  const sectionPromises = [];
  for (let s = 1; s <= SECTIONS_COUNT; s++) {
    sectionPromises.push(
      Question.aggregate([
        { $match: { section: s } },
        { $sample: { size: QUESTIONS_PER_SECTION } },
      ])
    );
  }

  const sectionResults = await Promise.all(sectionPromises);
  let allQuestions = sectionResults.flat();

  // Shuffle final order
  allQuestions = shuffle(allQuestions);

  // Build session question entries with shuffled option order
  const sessionQuestions = allQuestions.map((q) => {
    const shuffledOptionOrder = shuffle([0, 1, 2, 3]); // indices into original options[]
    return {
      question: q._id,
      shuffledOptionOrder,
      selectedAnswer: null,
      isCorrect: null,
    };
  });

  return { sessionQuestions, questions: allQuestions };
}

module.exports = { selectQuestions, shuffle };
