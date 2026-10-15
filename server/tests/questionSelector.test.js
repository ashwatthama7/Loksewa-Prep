const { shuffle } = require('../src/utils/questionSelector');
const { QUESTIONS_PER_SECTION, SECTIONS_COUNT, TOTAL_QUESTIONS } = require('../src/config/constants');

// Mock the selectQuestions function without a real DB by testing the logic components
describe('shuffle utility', () => {
  test('shuffle returns same length array', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(shuffle(arr)).toHaveLength(arr.length);
  });

  test('shuffle contains all original elements', () => {
    const arr = [0, 1, 2, 3];
    const shuffled = shuffle(arr);
    expect(shuffled.sort()).toEqual([0, 1, 2, 3]);
  });

  test('shuffle does not mutate original array', () => {
    const arr = [1, 2, 3];
    const original = [...arr];
    shuffle(arr);
    expect(arr).toEqual(original);
  });

  test('shuffle of single element returns same', () => {
    expect(shuffle([42])).toEqual([42]);
  });
});

describe('question selection logic (mock)', () => {
  test('total questions constant is correct', () => {
    expect(TOTAL_QUESTIONS).toBe(SECTIONS_COUNT * QUESTIONS_PER_SECTION);
    expect(TOTAL_QUESTIONS).toBe(100);
  });

  test('shuffledOptionOrder covers all 4 indices', () => {
    // Simulate creating shuffled option orders for 100 questions
    function createShuffledOrder() {
      const arr = [0, 1, 2, 3];
      return shuffle(arr);
    }

    for (let i = 0; i < 50; i++) {
      const order = createShuffledOrder();
      expect(order.sort()).toEqual([0, 1, 2, 3]);
      expect(order.length).toBe(4);
    }
  });

  test('simulated session has no duplicate question IDs per section', () => {
    // Simulate selecting 10 unique items from 15
    function sampleUnique(pool, n) {
      const shuffled = shuffle([...pool]);
      return shuffled.slice(0, n);
    }

    for (let section = 1; section <= SECTIONS_COUNT; section++) {
      const pool = Array.from({ length: 15 }, (_, i) => `S${section}-Q${i + 1}`);
      const selected = sampleUnique(pool, QUESTIONS_PER_SECTION);
      expect(selected.length).toBe(QUESTIONS_PER_SECTION);
      // No duplicates
      expect(new Set(selected).size).toBe(QUESTIONS_PER_SECTION);
    }
  });

  test('session question count matches total', () => {
    // Simulate combining 10 sections × 10 questions each
    const allSections = Array.from({ length: SECTIONS_COUNT }, (_, s) =>
      Array.from({ length: QUESTIONS_PER_SECTION }, (_, q) => ({ section: s + 1, qIndex: q }))
    );
    const combined = allSections.flat();
    expect(combined.length).toBe(TOTAL_QUESTIONS);
  });

  test('each section contributes exactly QUESTIONS_PER_SECTION questions', () => {
    // After shuffling, each section's count should remain 10
    const allSections = Array.from({ length: SECTIONS_COUNT }, (_, s) =>
      Array.from({ length: QUESTIONS_PER_SECTION }, () => ({ section: s + 1 }))
    );
    const combined = shuffle(allSections.flat());

    for (let s = 1; s <= SECTIONS_COUNT; s++) {
      const count = combined.filter((q) => q.section === s).length;
      expect(count).toBe(QUESTIONS_PER_SECTION);
    }
  });
});
