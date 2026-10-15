const crypto = require('crypto');
const User = require('../src/models/User');

describe('User Authentication & Security Logic', () => {
  test('hashes password and verifies correctly with comparePassword', async () => {
    const rawPassword = 'SecurePassword@123';
    const hash = await User.hashPassword(rawPassword);

    expect(hash).not.toBe(rawPassword);
    expect(hash.startsWith('$2')).toBe(true);

    const tempUser = new User({
      name: 'Tester',
      email: 'test_sec@example.com',
      passwordHash: hash,
      role: 'user',
    });

    const isMatch = await tempUser.comparePassword(rawPassword);
    expect(isMatch).toBe(true);

    const isWrongMatch = await tempUser.comparePassword('WrongPassword');
    expect(isWrongMatch).toBe(false);
  });

  test('toSafeObject strips passwordHash, googleId, and reset tokens', async () => {
    const rawPassword = 'SecretPassword@999';
    const hash = await User.hashPassword(rawPassword);

    const tempUser = new User({
      name: 'Safe User',
      email: 'safe@example.com',
      passwordHash: hash,
      googleId: 'google-uid-12345',
      role: 'user',
      resetPasswordToken: 'should_not_leak',
      resetPasswordExpires: new Date(Date.now() + 3600000),
    });

    const safe = tempUser.toSafeObject();

    expect(safe.passwordHash).toBeUndefined();
    expect(safe.googleId).toBeUndefined();
    expect(safe.resetPasswordToken).toBeUndefined();
    expect(safe.resetPasswordExpires).toBeUndefined();
    expect(safe.email).toBe('safe@example.com');
    expect(safe.hasPassword).toBe(true);
    expect(safe.hasGoogle).toBe(true);
  });

  test('password reset token hashing logic', () => {
    const rawToken = crypto.randomBytes(32).toString('hex');
    expect(rawToken.length).toBe(64);

    const hashedToken1 = crypto.createHash('sha256').update(rawToken).digest('hex');
    const hashedToken2 = crypto.createHash('sha256').update(rawToken).digest('hex');

    expect(hashedToken1).toBe(hashedToken2);
    expect(hashedToken1).not.toBe(rawToken);
  });
});
