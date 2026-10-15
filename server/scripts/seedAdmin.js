require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function seedAdmin() {
  // ── Security: refuse to run with missing credentials ──────────────────────
  const email    = process.env.ADMIN_EMAIL;
  const name     = process.env.ADMIN_NAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !name || !password) {
    console.error(
      '\n[seed:admin] ERROR: ADMIN_EMAIL, ADMIN_NAME and ADMIN_PASSWORD must all\n' +
      'be set in your .env file. No hardcoded fallbacks exist — this is intentional.\n' +
      'Copy server/.env.example to server/.env and fill in real values.\n'
    );
    process.exit(1);
  }

  if (password.length < 12) {
    console.error('[seed:admin] ERROR: ADMIN_PASSWORD must be at least 12 characters.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  let admin = await User.findOne({ email });
  if (admin) {
    // Idempotent: do not fail if admin already exists
    if (admin.role !== 'admin') {
      admin.role = 'admin';
      await admin.save();
      console.log(`Promoted existing user to admin: ${email}`);
    } else {
      console.log(`Admin already exists: ${email} — nothing to do.`);
    }
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await User.hashPassword(password);
  admin = await User.create({ name, email, passwordHash, role: 'admin' });
  console.log(`\nAdmin account created successfully.`);
  console.log(`  Email: ${admin.email}`);
  console.log(`  Name:  ${admin.name}`);
  console.log(`  Role:  ${admin.role}\n`);
  console.log('IMPORTANT: Change ADMIN_PASSWORD in your .env after first login.\n');
  await mongoose.disconnect();
}

seedAdmin().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
