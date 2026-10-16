const express = require('express');
const { body } = require('express-validator');
const passport = require('../config/passport');
const auth = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  register,
  login,
  me,
  logout,
  googleCallback,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');

const router = express.Router();

// ── Local auth ───────────────────────────────────────────────────────────────
router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
      .matches(/[0-9]/).withMessage('Password must contain a number'),
  ],
  register
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  login
);

router.get('/me', auth, me);
router.post('/logout', auth, logout);

// ── Forgot / Reset password ──────────────────────────────────────────────────
router.post(
  '/forgot-password',
  authLimiter, // rate-limit: prevent abuse / enumeration via timing
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  ],
  forgotPassword
);

router.post(
  '/reset-password/:token',
  authLimiter,
  [
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
      .matches(/[0-9]/).withMessage('Password must contain a number'),
    body('confirmPassword').custom((val, { req }) => {
      if (val !== req.body.password) throw new Error('Passwords do not match');
      return true;
    }),
  ],
  resetPassword
);

// ── Google OAuth ─────────────────────────────────────────────────────────────
router.get('/google', (req, res, next) => {
  if (!passport.hasGoogleAuth) {
    return res.status(503).json({
      message: 'Google Sign-in is not configured on this server. Please sign in with email and password.',
    });
  }
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  const origin = req.get('origin');
  const host = req.get('host');
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  const baseUrl = (process.env.CLIENT_URL || origin || `${protocol}://${host}` || '').replace(/\/$/, '');

  if (!passport.hasGoogleAuth) {
    return res.redirect(`${baseUrl}/login?error=google_not_configured`);
  }
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${baseUrl}/login?error=oauth`,
  })(req, res, (err) => {
    if (err) return next(err);
    googleCallback(req, res);
  });
});

module.exports = router;
