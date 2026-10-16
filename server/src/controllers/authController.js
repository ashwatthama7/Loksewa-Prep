const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { sendPasswordResetEmail } = require('../utils/mailer');

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

const setCookieToken = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ name, email, passwordHash });

    const token = signToken(user._id);
    setCookieToken(res, token);

    res.status(201).json({ user: user.toSafeObject(), token });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user._id);
    setCookieToken(res, token);

    res.json({ user: user.toSafeObject(), token });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
exports.me = async (req, res) => {
  res.json({ user: req.user.toSafeObject() });
};

// POST /api/auth/logout
exports.logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};

// GET /api/auth/google/callback — called after Passport handles OAuth
exports.googleCallback = (req, res) => {
  const token = signToken(req.user._id);
  setCookieToken(res, token);
  res.redirect(`${process.env.CLIENT_URL}/dashboard?token=${token}`);
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// ─────────────────────────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { email } = req.body;

    // Always return the same generic response to prevent email enumeration
    const GENERIC_MSG = 'If an account with that email exists, a password reset link has been sent.';

    const user = await User.findOne({ email });
    if (!user) {
      // Still respond 200 — do NOT reveal whether email exists
      return res.json({ message: GENERIC_MSG });
    }

    if (!user.passwordHash) {
      // Google-only account — no password to reset
      return res.json({ message: GENERIC_MSG });
    }

    // Generate a cryptographically secure random token
    const rawToken = crypto.randomBytes(32).toString('hex');

    // Store only the SHA-256 hash in the DB (raw token travels over email only)
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordToken   = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Determine the base client URL dynamically so it never produces 'undefined/reset-password/...'
    const origin = req.get('origin');
    const host = req.get('host');
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const baseUrl = (process.env.CLIENT_URL || origin || `${protocol}://${host}` || 'http://localhost:5173').replace(/\/$/, '');
    const resetUrl = `${baseUrl}/reset-password/${rawToken}`;

    let mailResult = { sent: false };
    try {
      mailResult = await sendPasswordResetEmail(user.email, resetUrl);
    } catch (mailErr) {
      // Roll back the token so the user can try again
      user.resetPasswordToken   = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      console.error('[forgot-password] mail error:', mailErr.message);

      if (process.env.NODE_ENV === 'production' && !process.env.SMTP_HOST) {
        return res.status(503).json({
          message: 'Password reset via email is currently unavailable (SMTP is not configured on the server). Please configure SMTP credentials or contact the administrator.',
        });
      }

      return res.status(500).json({ message: 'Failed to send reset email. Please try again later.' });
    }

    const payload = { message: GENERIC_MSG };

    // STRICT SECURITY: devResetUrl is ONLY ever included in local development mode. NEVER in production!
    if (process.env.NODE_ENV === 'development' && mailResult?.simulated) {
      payload.devResetUrl = resetUrl;
    }

    res.json(payload);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/reset-password/:token
// ─────────────────────────────────────────────────────────────────────────────
exports.resetPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const rawToken = req.params.token;
    const { password } = req.body;

    // Hash the incoming token to compare with the stored hash
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Find user with matching token that hasn't expired
    // Need to explicitly select the hidden fields
    const user = await User.findOne({
      resetPasswordToken:   hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return res.status(400).json({
        message: 'Password reset link is invalid or has expired. Please request a new one.',
      });
    }

    // Set new password and clear the reset fields
    user.passwordHash         = await User.hashPassword(password);
    user.resetPasswordToken   = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Automatically log the user in after reset
    const token = signToken(user._id);
    setCookieToken(res, token);

    res.json({
      message: 'Password reset successful. You are now logged in.',
      user: user.toSafeObject(),
      token,
    });
  } catch (err) {
    next(err);
  }
};
