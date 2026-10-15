// Scoring constants — change these to adjust quiz rules
const MARKS_PER_QUESTION = 1;          // marks awarded for a correct answer
const PENALTY_PERCENTAGE = 0.20;       // fraction of mark deducted for wrong answer (0.20 = 20%)
const PENALTY_PER_QUESTION = MARKS_PER_QUESTION * PENALTY_PERCENTAGE; // 0.2

// Quiz structure constants
const SECTIONS_COUNT = 10;             // number of sections (1-10)
const QUESTIONS_PER_SECTION = 10;      // questions sampled from each section
const TOTAL_QUESTIONS = SECTIONS_COUNT * QUESTIONS_PER_SECTION; // 100
const QUESTIONS_PER_PAGE = 20;         // shown per page

module.exports = {
  MARKS_PER_QUESTION,
  PENALTY_PERCENTAGE,
  PENALTY_PER_QUESTION,
  SECTIONS_COUNT,
  QUESTIONS_PER_SECTION,
  TOTAL_QUESTIONS,
  QUESTIONS_PER_PAGE,
};
