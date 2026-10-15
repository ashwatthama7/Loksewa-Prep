import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { resetPassword } from '../api/auth';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState([]);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors([]);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await resetPassword(token, password, confirmPassword);
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
      }
      setSuccess(true);
      setTimeout(() => {
        // Reload to let AuthContext initialize with updated session
        window.location.href = '/dashboard';
      }, 2000);
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        setFieldErrors(data.errors);
      } else {
        setError(data?.message || 'Password reset failed or token is invalid.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="text-center mb-8">
            <span className="text-4xl">🔑</span>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">Set New Password</h1>
            <p className="text-gray-500 text-sm mt-1">
              Please enter your new strong password below.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {fieldErrors.length > 0 && (
            <ul className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm space-y-1">
              {fieldErrors.map((e, i) => (
                <li key={i}>• {e.msg}</li>
              ))}
            </ul>
          )}

          {success ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm text-center space-y-3">
              <p className="font-semibold text-base">Password Reset Successfully! 🎉</p>
              <p>Redirecting you to your dashboard in a moment...</p>
              <button
                onClick={() => { window.location.href = '/dashboard'; }}
                className="btn-primary w-full mt-2"
              >
                Go to Dashboard Now
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">New Password</label>
                <input
                  type="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  required
                />
              </div>

              <div>
                <label className="label">Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input"
                  placeholder="Repeat new password"
                  required
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Resetting Password...' : 'Reset Password'}
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
