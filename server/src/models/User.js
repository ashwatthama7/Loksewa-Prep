const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name:          { type: String, required: true, trim: true },
    email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash:  { type: String },        // optional for Google-only users
    googleId:      { type: String, sparse: true },
    role:          { type: String, enum: ['user', 'admin'], default: 'user' },

    // Password-reset flow
    resetPasswordToken:   { type: String, select: false }, // hashed token stored in DB
    resetPasswordExpires: { type: Date,   select: false }, // expiry timestamp
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

userSchema.methods.comparePassword = async function (plainPassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(plainPassword, this.passwordHash);
};

userSchema.statics.hashPassword = async function (plain) {
  return bcrypt.hash(plain, 12);
};

// Never expose passwordHash or googleId to the client
userSchema.methods.toSafeObject = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    createdAt: this.createdAt,
    hasGoogle: !!this.googleId,
    hasPassword: !!this.passwordHash,
  };
};

module.exports = mongoose.model('User', userSchema);
