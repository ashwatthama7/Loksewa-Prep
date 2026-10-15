const { validationResult } = require('express-validator');
const { parse } = require('csv-parse/sync');
const Question = require('../models/Question');
const User = require('../models/User');
const QuizSession = require('../models/QuizSession');
const { SECTIONS_COUNT, QUESTIONS_PER_SECTION } = require('../config/constants');

// GET /api/admin/stats
exports.getStats = async (req, res, next) => {
  try {
    const [totalQuestions, totalUsers, totalAttempts, sectionCounts] = await Promise.all([
      Question.countDocuments(),
      User.countDocuments({ role: 'user' }),
      QuizSession.countDocuments({ status: 'completed' }),
      Question.aggregate([
        { $group: { _id: '$section', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const countMap = {};
    sectionCounts.forEach((s) => { countMap[s._id] = s.count; });

    const sections = [];
    for (let s = 1; s <= SECTIONS_COUNT; s++) {
      const count = countMap[s] || 0;
      sections.push({
        section: s,
        count,
        needsMore: count < QUESTIONS_PER_SECTION,
        deficit: Math.max(0, QUESTIONS_PER_SECTION - count),
      });
    }

    res.json({ totalQuestions, totalUsers, totalAttempts, sections });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/questions
exports.getQuestions = async (req, res, next) => {
  try {
    const { section, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (section) filter.section = parseInt(section);
    if (search) filter.questionText = { $regex: search, $options: 'i' };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [questions, total] = await Promise.all([
      Question.find(filter).sort({ section: 1, createdAt: 1 }).skip(skip).limit(parseInt(limit)),
      Question.countDocuments(filter),
    ]);

    res.json({ questions, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/questions
exports.createQuestion = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { section, questionText, options, correctAnswer, questionId } = req.body;
    const question = await Question.create({ section, questionText, options, correctAnswer, questionId });
    res.status(201).json(question);
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/questions/:id
exports.updateQuestion = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { section, questionText, options, correctAnswer } = req.body;
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      { section, questionText, options, correctAnswer },
      { new: true, runValidators: true }
    );

    if (!question) return res.status(404).json({ message: 'Question not found' });
    res.json(question);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/questions/:id
exports.deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });
    res.json({ message: 'Question deleted', questionId: question.questionId });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/questions/bulk
exports.bulkUpload = async (req, res, next) => {
  try {
    if (!req.file && !req.body.data) {
      return res.status(400).json({ message: 'No file or data provided' });
    }

    let rows = [];

    if (req.file) {
      const content = req.file.buffer.toString('utf-8');

      if (req.file.mimetype === 'application/json' || req.file.originalname.endsWith('.json')) {
        try {
          rows = JSON.parse(content);
          if (!Array.isArray(rows)) rows = [rows];
        } catch {
          return res.status(400).json({ message: 'Invalid JSON file' });
        }
      } else {
        // CSV
        try {
          rows = parse(content, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
          });
        } catch (e) {
          return res.status(400).json({ message: 'Invalid CSV file: ' + e.message });
        }
      }
    } else {
      rows = req.body.data;
      if (!Array.isArray(rows)) rows = [rows];
    }

    const accepted = [];
    const rejected = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;

      try {
        // Normalize CSV fields
        const section = parseInt(row.section);
        const questionText = (row.questionText || row.question_text || '').trim();
        const options = [
          row.option1 || row.options?.[0],
          row.option2 || row.options?.[1],
          row.option3 || row.options?.[2],
          row.option4 || row.options?.[3],
        ].map((o) => (o || '').toString().trim());

        const correctAnswer = parseInt(row.correctAnswer ?? row.correct_answer);

        // Validation
        if (isNaN(section) || section < 1 || section > SECTIONS_COUNT) {
          rejected.push({ row: rowNum, reason: 'Invalid section (must be 1-10)' });
          continue;
        }
        if (!questionText) {
          rejected.push({ row: rowNum, reason: 'Missing questionText' });
          continue;
        }
        if (options.some((o) => !o) || options.length !== 4) {
          rejected.push({ row: rowNum, reason: 'Must have exactly 4 non-empty options' });
          continue;
        }
        if (isNaN(correctAnswer) || correctAnswer < 0 || correctAnswer > 3) {
          rejected.push({ row: rowNum, reason: 'correctAnswer must be 0-3' });
          continue;
        }

        accepted.push({ section, questionText, options, correctAnswer });
      } catch (e) {
        rejected.push({ row: rowNum, reason: e.message });
      }
    }

    let created = 0;
    if (accepted.length > 0) {
      const docs = await Question.insertMany(accepted, { ordered: false });
      created = docs.length;
    }

    res.json({
      message: `Bulk upload complete. ${created} created, ${rejected.length} rejected.`,
      created,
      rejected,
    });
  } catch (err) {
    next(err);
  }
};
