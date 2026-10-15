import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentSession, startQuiz, saveAnswer, submitQuiz } from '../api/quiz';
import LoadingSpinner from '../components/LoadingSpinner';

const QUESTIONS_PER_PAGE = 20;
const TOTAL_QUESTIONS = 100;

export default function QuizPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0); // 0-indexed
  const [showSubmitWarning, setShowSubmitWarning] = useState(false);
  const saveQueue = useRef(new Map()); // debounce saves
  const saveTimers = useRef({});

  // Load or create session
  useEffect(() => {
    const load = async () => {
      try {
        let res;
        try {
          res = await getCurrentSession();
        } catch (err) {
          if (err.response?.status === 404) {
            res = await startQuiz();
          } else throw err;
        }
        setSession(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => {
      // Flush all pending saves on unmount
      Object.values(saveTimers.current).forEach(clearTimeout);
    };
  }, []);

  const answeredCount = session
    ? session.questions.filter((q) => q.selectedAnswer !== null && q.selectedAnswer !== undefined).length
    : 0;

  const pageQuestions = session
    ? session.questions.slice(page * QUESTIONS_PER_PAGE, (page + 1) * QUESTIONS_PER_PAGE)
    : [];

  // Auto-save answer with debounce
  const handleSelect = useCallback(
    (questionIndex, selectedAnswer) => {
      if (!session) return;

      // Optimistic update
      setSession((prev) => {
        const updated = { ...prev };
        updated.questions = [...prev.questions];
        updated.questions[questionIndex] = {
          ...prev.questions[questionIndex],
          selectedAnswer,
        };
        return updated;
      });

      // Debounce server save (200ms)
      if (saveTimers.current[questionIndex]) {
        clearTimeout(saveTimers.current[questionIndex]);
      }
      saveTimers.current[questionIndex] = setTimeout(async () => {
        try {
          await saveAnswer(questionIndex, selectedAnswer);
        } catch {
          // Silently retry — answer is still shown locally
        }
      }, 200);
    },
    [session]
  );

  const handleSubmit = async () => {
    const unanswered = TOTAL_QUESTIONS - answeredCount;
    if (unanswered > 0 && !showSubmitWarning) {
      setShowSubmitWarning(true);
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitQuiz();
      navigate(`/quiz/${res.data.sessionId}/review`);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed');
      setSubmitting(false);
    }
  };

  const getQuestionStatus = (q) => {
    if (q.selectedAnswer !== null && q.selectedAnswer !== undefined) return 'answered';
    return 'unanswered';
  };

  const totalPages = 5;

  if (loading) return <LoadingSpinner size="lg" className="mt-20" />;
  if (error) return (
    <div className="max-w-2xl mx-auto mt-20 text-center">
      <div className="card">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={() => navigate('/dashboard')} className="btn-secondary">Back to Dashboard</button>
      </div>
    </div>
  );
  if (!session) return null;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main question area */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="card mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-bold text-lg text-gray-800">Master Quiz</h1>
                <p className="text-sm text-gray-500">
                  Page {page + 1} of {totalPages} &nbsp;·&nbsp;
                  Questions {page * QUESTIONS_PER_PAGE + 1}–{Math.min((page + 1) * QUESTIONS_PER_PAGE, TOTAL_QUESTIONS)}
                </p>
              </div>
              <span className="text-sm font-medium px-3 py-1 bg-primary-100 text-primary-700 rounded-full">
                Answered {answeredCount} / {TOTAL_QUESTIONS}
              </span>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            {pageQuestions.map((q, pageIdx) => {
              const absIdx = page * QUESTIONS_PER_PAGE + pageIdx;
              return (
                <div key={absIdx} className="card" id={`q-${absIdx}`}>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-700 text-sm font-bold flex items-center justify-center">
                      {absIdx + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-gray-800 font-medium mb-1 text-xs text-primary-600">Section {q.section}</p>
                      <p className="text-gray-900 mb-4 leading-relaxed">{q.questionText}</p>
                      <div className="space-y-2">
                        {q.options.map((opt, optIdx) => {
                          const selected = q.selectedAnswer === optIdx;
                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleSelect(absIdx, optIdx)}
                              className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all text-sm ${
                                selected
                                  ? 'border-primary-500 bg-primary-50 text-primary-800 font-medium'
                                  : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50 text-gray-700'
                              }`}
                            >
                              <span className="font-medium mr-2 text-gray-400">{String.fromCharCode(65 + optIdx)}.</span>
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => { setPage(p => p - 1); window.scrollTo(0, 0); }}
              disabled={page === 0}
              className="btn-secondary"
            >
              ← Previous
            </button>

            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => { setPage(i); window.scrollTo(0, 0); }}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    i === page ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            {page < totalPages - 1 ? (
              <button
                onClick={() => { setPage(p => p + 1); window.scrollTo(0, 0); }}
                className="btn-primary"
              >
                Next →
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting} className="btn-primary bg-green-600 hover:bg-green-700">
                {submitting ? 'Submitting...' : '✓ Submit Quiz'}
              </button>
            )}
          </div>

          {/* Submit warning */}
          {showSubmitWarning && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 font-medium">
                ⚠️ You have {TOTAL_QUESTIONS - answeredCount} unanswered question(s). Submit anyway?
              </p>
              <div className="flex gap-3 mt-3">
                <button onClick={handleSubmit} disabled={submitting} className="btn-primary bg-green-600 hover:bg-green-700">
                  {submitting ? 'Submitting...' : 'Yes, Submit'}
                </button>
                <button onClick={() => setShowSubmitWarning(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Question Tracker (sidebar) */}
        <div className="w-full lg:w-56 flex-shrink-0">
          <div className="card sticky top-20">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Question Tracker</h3>
            <p className="text-xs text-gray-500 mb-3">
              <span className="inline-block w-3 h-3 rounded bg-primary-500 mr-1" />Answered
              <span className="inline-block w-3 h-3 rounded bg-gray-200 mx-1 ml-3" />Unanswered
              <span className="inline-block w-3 h-3 rounded border-2 border-primary-400 mr-1 ml-3" />Current page
            </p>
            <div className="grid grid-cols-5 gap-1">
              {session.questions.map((q, idx) => {
                const qPage = Math.floor(idx / QUESTIONS_PER_PAGE);
                const isCurrentPage = qPage === page;
                const answered = q.selectedAnswer !== null && q.selectedAnswer !== undefined;
                return (
                  <button
                    key={idx}
                    onClick={() => { setPage(qPage); window.scrollTo(0, 0); }}
                    title={`Q${idx + 1}`}
                    className={`w-full aspect-square text-xs rounded flex items-center justify-center font-medium transition-all ${
                      answered
                        ? 'bg-primary-500 text-white'
                        : isCurrentPage
                        ? 'border-2 border-primary-400 text-primary-600'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
              <div className="flex justify-between mb-1">
                <span>Answered</span>
                <span className="font-semibold text-primary-700">{answeredCount}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Unanswered</span>
                <span className="font-semibold text-gray-600">{TOTAL_QUESTIONS - answeredCount}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                <div
                  className="bg-primary-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${(answeredCount / TOTAL_QUESTIONS) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
