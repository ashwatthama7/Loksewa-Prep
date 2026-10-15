const mongoose = require('mongoose');

const connectDB = async () => {
  let rawUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!rawUri) {
    console.error(
      '\n[db] ERROR: Neither MONGO_URI nor MONGODB_URI is defined in your environment variables.\n' +
      'Please add MONGO_URI in your Render Dashboard -> Environment tab.\n'
    );
    process.exit(1);
  }

  // Sanitize: strip surrounding quotes and accidental whitespace from copy-pasting
  const uri = rawUri.trim().replace(/^["']|["']$/g, '');

  // Diagnostic parsing (safe, never prints the raw password)
  try {
    const authPartMatch = uri.match(/mongodb(?:\+srv)?:\/\/([^:]+):([^@]+)@([^/?]+)/);
    if (authPartMatch) {
      const username = authPartMatch[1];
      const password = authPartMatch[2];
      const host = authPartMatch[3];

      console.log(`[db] Target host: ${host}`);
      console.log(`[db] Auth username: "${username}" (length: ${username.length})`);
      console.log(`[db] Password length: ${password.length} characters`);

      if (username.startsWith('<') || username.endsWith('>') || password.startsWith('<') || password.endsWith('>')) {
        console.error('\n[db] CRITICAL WARNING: Your username or password contains literal "<" or ">" angle brackets! Remove them from MONGO_URI in Render.\n');
      }
      if (password.includes('@') || password.includes(':') || password.includes('#') || password.includes('%')) {
        console.warn('[db] NOTICE: Password contains special characters. If authentication fails, ensure they are URL-encoded or use an alphanumeric-only password.');
      }
    }
  } catch (parseErr) {
    // ignore parse check
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
