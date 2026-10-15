import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminStats } from '../../api/admin';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAdminStats()
      .then((res) => setStats(res.data))
      .catch(() => setError('Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner size="lg" className="mt-20" />;
  if (error) return <div className="text-red-600 mt-10">{error}</div>;

  const warningSections = stats?.sections?.filter((s) => s.needsMore) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="flex gap-3">
          <Link to="/admin/questions" className="btn-primary">Manage Questions</Link>
          <Link to="/admin/bulk-upload" className="btn-secondary">Bulk Upload</Link>
        </div>
      </div>

      {/* Warning Banner */}
      {warningSections.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg">
          <p className="font-semibold text-amber-800 mb-2">⚠️ Sections below minimum (need 10 questions each):</p>
          <ul className="text-sm text-amber-700 space-y-1">
            {warningSections.map((s) => (
              <li key={s.section}>
                Section {s.section}: {s.count} questions (need {s.deficit} more)
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-primary-700">{stats?.totalQuestions}</p>
          <p className="text-sm text-gray-500 mt-1">Total Questions</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-700">{stats?.totalUsers}</p>
          <p className="text-sm text-gray-500 mt-1">Registered Users</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-blue-700">{stats?.totalAttempts}</p>
          <p className="text-sm text-gray-500 mt-1">Quiz Attempts</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-amber-700">{warningSections.length}</p>
          <p className="text-sm text-gray-500 mt-1">Sections Need Questions</p>
        </div>
      </div>

      {/* Section breakdown */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Questions per Section</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {stats?.sections?.map((s) => (
            <div
              key={s.section}
              className={`p-3 rounded-lg border-2 text-center ${
                s.needsMore ? 'border-red-300 bg-red-50' : 'border-green-200 bg-green-50'
              }`}
            >
              <p className="text-lg font-bold text-gray-800">{s.count}</p>
              <p className={`text-xs font-medium ${s.needsMore ? 'text-red-600' : 'text-green-600'}`}>
                Section {s.section}
              </p>
              {s.needsMore && (
                <p className="text-xs text-red-500 mt-0.5">need {s.deficit} more</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
