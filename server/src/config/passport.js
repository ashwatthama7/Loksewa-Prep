const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

const hasGoogleAuth = !!(
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  !process.env.GOOGLE_CLIENT_ID.includes('your_google_client_id')
);

if (hasGoogleAuth) {
  const callbackURL = process.env.SERVER_URL
    ? `${process.env.SERVER_URL.replace(/\/$/, '')}/api/auth/google/callback`
    : '/api/auth/google/callback';

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL,
        proxy: true, // Crucial for HTTPS reverse proxies (Render, Railway, Heroku, etc.)
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails && profile.emails[0] && profile.emails[0].value;

          // Check if user exists with this googleId
          let user = await User.findOne({ googleId: profile.id });
          if (user) return done(null, user);

          // Check if local account with same email exists (link accounts)
          if (email) {
            user = await User.findOne({ email });
            if (user) {
              user.googleId = profile.id;
              if (!user.name) user.name = profile.displayName;
              await user.save();
              return done(null, user);
            }
          }

          // Create new user
          user = await User.create({
            name: profile.displayName,
            email,
            googleId: profile.id,
            role: 'user',
          });
          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
} else {
  console.log('[auth] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not configured — Google OAuth disabled.');
}

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
module.exports.hasGoogleAuth = hasGoogleAuth;
