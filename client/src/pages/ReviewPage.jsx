import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getReview } from '../api/quiz';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ReviewPage() {
  const { sessionId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all | correct | incorrect | unanswered

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getReview(sessionId);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load review');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sessionId]);

  if (loading) return <LoadingSpinner size="lg" className="mt-20" />;
  if (error) return <div className="text-center mt-20 text-red-600">{error}</div>;
  if (!data) return null;

  const filtered = data.questions.filter((q) => {
    if (filter === 'correct') return q.isCorrect === true;
    if (filter === 'incorrect') return q.isCorrect === false;
    if (filter === 'unanswered') return q.isCorrect === null;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Result summary */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Quiz Review</h1>
            <p className="text-gray-500 text-sm">
              Completed on {new Date(data.completedAt).toLocaleString()}
            </p>
          </div>
          <Link to="/dashboard" className="btn-secondary">← Dashboard</Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="text-center p-3 bg-primary-50 rounded-lg">
            <p className="text-2xl font-bold text-primary-700">{data.finalScore.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">Final Score</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-700">{data.correctCount}</p>
            <p className="text-xs text-gray-500 mt-1">Correct</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-700">{data.incorrectCount}</p>
            <p className="text-xs text-gray-500 mt-1">Incorrect</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-600">{data.unansweredCount}</p>
            <p className="text-xs text-gray-500 mt-1">Unanswered</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'correct', 'incorrect', 'unanswered'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-primary-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} {f === 'all' ? `(${data.questions.length})` : f === 'correct' ? `(${data.correctCount})` : f === 'incorrect' ? `(${data.incorrectCount})` : `(${data.unansweredCount})`}
          </button>
        ))}
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {filtered.map((q) => {
          const statusBg = q.isCorrect === true ? 'border-green-300 bg-green-50' : q.isCorrect === false ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50';
          const statusIcon = q.isCorrect === true ? '✓' : q.isCorrect === false ? '✗' : '—';
          const statusColor = q.isCorrect === true ? 'text-green-600' : q.isCorrect === false ? 'text-red-600' : 'text-gray-500';

          return (
            <div key={q.index} className={`card border-2 ${statusBg}`}>
              <div className="flex items-start gap-3">
                <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold ${statusColor}`}>
                  {statusIcon}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-500">Q{q.index + 1}</span>
                    <span className="text-xs px-2 py-0.5 bg-gray-200 rounded text-gray-600">Section {q.section}</span>
                  </div>
                  <p className="text-gray-900 font-medium mb-3">{q.questionText}</p>
                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => {
                      const isCorrectOpt = optIdx === q.correctAnswer;
                      const isSelectedOpt = optIdx === q.selectedAnswer;
                      let cls = 'border-gray-200 bg-white text-gray-700';
                      if (isCorrectOpt) cls = 'border-green-400 bg-green-100 text-green-800 font-semibold';
                      else if (isSelectedOpt && !isCorrectOpt) cls = 'border-red-400 bg-red-100 text-red-800';
                      return (
                        <div key={optIdx} className={`px-4 py-2 rounded-lg border-2 text-sm flex items-center gap-2 ${cls}`}>
                          <span className="font-medium text-gray-400">{String.fromCharCode(65 + optIdx)}.</span>
                          {opt}
                          {isCorrectOpt && <span className="ml-auto text-green-600 text-xs font-bold">✓ Correct</span>}
                          {isSelectedOpt && !isCorrectOpt && <span className="ml-auto text-red-600 text-xs font-bold">✗ Your answer</span>}
                        </div>
                      );
                    })}
                  </div>
                  {q.selectedAnswer === null && (
                    <p className="text-gray-500 text-sm mt-2 italic">Not answered</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
