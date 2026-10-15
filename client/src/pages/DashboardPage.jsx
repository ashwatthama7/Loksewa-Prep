import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, ReferenceLine,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { getDashboardStats } from '../api/dashboard';
import { startQuiz, getCurrentSession } from '../api/quiz';
import LoadingSpinner from '../components/LoadingSpinner';

const StatCard = ({ label, value, sub, color = 'primary' }) => {
  const colors = {
    primary: 'bg-primary-50 text-primary-700 border-primary-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  };
  return (
    <div className={`card border ${colors[color]}`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs mt-1 opacity-60">{sub}</p>}
    </div>
  );
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [inProgress, setInProgress] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, sessionRes] = await Promise.allSettled([
          getDashboardStats(),
          getCurrentSession(),
        ]);
        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
        if (sessionRes.status === 'fulfilled') setInProgress(true);
      } catch {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleStartQuiz = async () => {
    setStarting(true);
    setError('');
    try {
      if (inProgress) {
        navigate('/quiz');
        return;
      }
      await startQuiz();
      navigate('/quiz');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to start quiz';
      const insufficient = err.response?.data?.insufficientSections;
      if (insufficient) {
        setError(`Cannot start quiz: sections ${insufficient.map(s => s.section).join(', ')} need more questions.`);
      } else {
        setError(msg);
      }
    } finally {
      setStarting(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" className="mt-20" />;

  const scoreChartData = stats?.scoreHistory?.map((s, i) => ({
    attempt: `#${i + 1}`,
    score: s.score,
  })) || [];

  const sectionData = stats?.sectionAccuracy || [];
  const weakSections = sectionData.filter(s => s.accuracy < 50 && s.total > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}! 👋</h1>
          <p className="text-gray-500 text-sm mt-1">Master Quiz — 100 questions across 10 sections</p>
        </div>
        <div className="flex gap-3">
          {inProgress && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Quiz in progress
            </span>
          )}
          <button onClick={handleStartQuiz} disabled={starting} className="btn-primary">
            {starting ? 'Loading...' : inProgress ? '▶ Resume Quiz' : '🚀 Start New Quiz'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      {/* Stats Cards */}
      {stats && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard label="Total Attempts" value={stats.totalAttempts} />
            <StatCard label="Best Score" value={stats.bestScore?.toFixed(2) ?? '—'} color="green" />
            <StatCard label="Avg Score" value={stats.averageScore?.toFixed(2) ?? '—'} />
            <StatCard label="Total Correct" value={stats.totalCorrect} color="green" />
            <StatCard label="Total Incorrect" value={stats.totalIncorrect} color="red" />
            <StatCard label="Accuracy" value={`${stats.overallAccuracy}%`} color="primary" />
          </div>

          {/* Charts */}
          {scoreChartData.length > 0 && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Score over time */}
              <div className="card">
                <h2 className="font-semibold text-gray-800 mb-4">Score Over Time</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={scoreChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="attempt" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Section accuracy */}
              <div className="card">
                <h2 className="font-semibold text-gray-800 mb-4">Section-wise Accuracy</h2>
                {weakSections.length > 0 && (
                  <p className="text-xs text-red-600 mb-2">
                    Weak sections: {weakSections.map(s => `S${s.section}`).join(', ')}
                  </p>
                )}
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={sectionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="section" tickFormatter={v => `S${v}`} tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => `${v}%`} labelFormatter={l => `Section ${l}`} />
                    <ReferenceLine y={50} stroke="#ef4444" strokeDasharray="4 4" />
                    <Bar dataKey="accuracy" radius={[4, 4, 0, 0]}>
                      {sectionData.map((entry, index) => (
                        <Cell key={index} fill={entry.accuracy < 50 ? '#ef4444' : '#2563eb'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Attempt history */}
          {stats.sessions?.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-gray-800 mb-4">Attempt History</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-gray-100">
                      <th className="pb-3 pr-4 text-gray-500 font-medium">#</th>
                      <th className="pb-3 pr-4 text-gray-500 font-medium">Date</th>
                      <th className="pb-3 pr-4 text-gray-500 font-medium">Score</th>
                      <th className="pb-3 pr-4 text-gray-500 font-medium text-green-600">Correct</th>
                      <th className="pb-3 pr-4 text-gray-500 font-medium text-red-600">Wrong</th>
                      <th className="pb-3 pr-4 text-gray-500 font-medium">Skipped</th>
                      <th className="pb-3 text-gray-500 font-medium">Review</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...stats.sessions].reverse().map((s, i) => (
                      <tr key={s._id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 pr-4 text-gray-400">{stats.sessions.length - i}</td>
                        <td className="py-3 pr-4 text-gray-600">{new Date(s.startedAt).toLocaleDateString()}</td>
                        <td className="py-3 pr-4 font-semibold text-primary-700">{s.finalScore.toFixed(2)}</td>
                        <td className="py-3 pr-4 text-green-600">{s.correctCount}</td>
                        <td className="py-3 pr-4 text-red-600">{s.incorrectCount}</td>
                        <td className="py-3 pr-4 text-gray-500">{s.unansweredCount}</td>
                        <td className="py-3">
                          <Link to={`/quiz/${s._id}/review`} className="text-primary-600 hover:underline font-medium">
                            Review →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {stats.totalAttempts === 0 && (
            <div className="card text-center py-12 text-gray-400">
              <p className="text-5xl mb-4">📝</p>
              <p className="text-lg font-medium">No attempts yet</p>
              <p className="text-sm mt-1">Start your first quiz to see your stats here!</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
