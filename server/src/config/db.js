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

  // Sanitize: strip surrounding quotes and accidental whitespace
  let uri = rawUri.trim().replace(/^["']|["']$/g, '');

  // Fix accidental double slashes in path (e.g. .mongodb.net//loksewa_quiz -> .mongodb.net/loksewa_quiz)
  const protoSplit = uri.split('://');
  if (protoSplit.length === 2) {
    uri = protoSplit[0] + '://' + protoSplit[1].replace(/\/{2,}/g, '/');
  }

  // Diagnostic parsing (safe, never prints the raw password)
  try {
    const authPartMatch = uri.match(/mongodb(?:\+srv)?:\/\/([^:]+):([^@]+)@([^/?]+)(?:\/([^?]+))?/);
    if (authPartMatch) {
      const username = authPartMatch[1];
      const host = authPartMatch[3];
      const dbName = authPartMatch[4] || '(default)';

      console.log(`[db] Target host: ${host}`);
      console.log(`[db] Target database: ${dbName}`);
      console.log(`[db] Auth username: "${username}"`);
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
