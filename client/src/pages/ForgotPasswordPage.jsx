import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [devResetUrl, setDevResetUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStatusMessage('');
    setDevResetUrl('');
    setLoading(true);

    try {
      const res = await forgotPassword(email);
      setStatusMessage(res.data.message || 'If an account exists, a reset link has been sent.');
      if (res.data.devResetUrl) {
        setDevResetUrl(res.data.devResetUrl);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send password reset request.');
    } finally {
      setLoading(false);
    }
  };

  // Convert absolute reset URL to relative route for React Router if it matches current host
  const getRelativePath = (fullUrl) => {
    try {
      const parsed = new URL(fullUrl, window.location.origin);
      return parsed.pathname;
    } catch {
      return fullUrl;
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="text-center mb-8">
            <span className="text-4xl">🔐</span>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">Forgot Password</h1>
            <p className="text-gray-500 text-sm mt-1">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {statusMessage ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                <p className="font-semibold mb-1">Check your inbox</p>
                <p>{statusMessage}</p>
              </div>

              {devResetUrl && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-sm space-y-2">
                  <p className="font-semibold text-amber-800">⚡ Demo / Development Mode</p>
                  <p className="text-xs text-amber-700">
                    Because no SMTP email provider is configured in environment variables, here is your direct password reset link:
                  </p>
                  <div>
                    <Link
                      to={getRelativePath(devResetUrl)}
                      className="inline-block px-3 py-1.5 bg-amber-600 text-white rounded font-medium text-xs hover:bg-amber-700 transition"
                    >
                      Reset Password Now →
                    </Link>
                  </div>
                </div>
              )}

              <div className="text-center pt-2">
                <Link to="/login" className="btn-secondary w-full">
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Registered Email</label>
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Sending link...' : 'Send Reset Link'}
              </button>

              <div className="text-center pt-2">
                <Link to="/login" className="text-sm text-primary-600 hover:underline font-medium">
                  ← Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
