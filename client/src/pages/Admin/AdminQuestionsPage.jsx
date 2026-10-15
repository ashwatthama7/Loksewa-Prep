import { useState, useEffect } from 'react';
import { getQuestions, createQuestion, updateQuestion, deleteQuestion } from '../../api/admin';
import LoadingSpinner from '../../components/LoadingSpinner';

const EMPTY_FORM = { section: 1, questionText: '', options: ['', '', '', ''], correctAnswer: 0 };

function QuestionForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);

  const handleOptionChange = (i, val) => {
    setForm((f) => { const opts = [...f.options]; opts[i] = val; return { ...f, options: opts }; });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setSaving(true);
    try {
      await onSave(form);
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) setErrors(data.errors.map((e) => e.msg));
      else setErrors([data?.message || 'Save failed']);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.length > 0 && (
        <ul className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm space-y-1">
          {errors.map((e, i) => <li key={i}>• {e}</li>)}
        </ul>
      )}
      <div>
        <label className="label">Section (1–10)</label>
        <select
          value={form.section}
          onChange={(e) => setForm((f) => ({ ...f, section: parseInt(e.target.value) }))}
          className="input"
        >
          {Array.from({ length: 10 }, (_, i) => (
            <option key={i + 1} value={i + 1}>Section {i + 1}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Question Text</label>
        <textarea
          value={form.questionText}
          onChange={(e) => setForm((f) => ({ ...f, questionText: e.target.value }))}
          className="input min-h-[80px]"
          placeholder="Enter the question..."
          required
        />
      </div>
      <div>
        <label className="label">Options & Correct Answer</label>
        <div className="space-y-2">
          {form.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name="correctAnswer"
                checked={form.correctAnswer === i}
                onChange={() => setForm((f) => ({ ...f, correctAnswer: i }))}
                className="w-4 h-4 text-primary-600"
              />
              <span className="text-sm font-medium text-gray-500 w-4">{String.fromCharCode(65 + i)}.</span>
              <input
                type="text"
                value={opt}
                onChange={(e) => handleOptionChange(i, e.target.value)}
                className="input flex-1"
                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                required
              />
              {form.correctAnswer === i && (
                <span className="text-xs text-green-600 font-medium whitespace-nowrap">✓ Correct</span>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1">Select the radio button to mark the correct answer</p>
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : 'Save Question'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        )}
      </div>
    </form>
  );
}

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getQuestions({ search, section: sectionFilter, page, limit: 15 });
      setQuestions(res.data.questions);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, sectionFilter, page]);

  const handleCreate = async (form) => {
    await createQuestion(form);
    setShowForm(false);
    load();
  };

  const handleUpdate = async (form) => {
    await updateQuestion(editingId, form);
    setEditingId(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    setDeleting(id);
    try {
      await deleteQuestion(id);
      load();
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Manage Questions</h1>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); }} className="btn-primary">
          {showForm ? 'Cancel' : '+ Add Question'}
        </button>
      </div>

      {/* Add question form */}
      {showForm && !editingId && (
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">New Question</h2>
          <QuestionForm onSave={handleCreate} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input flex-1"
          />
          <select
            value={sectionFilter}
            onChange={(e) => { setSectionFilter(e.target.value); setPage(1); }}
            className="input w-full sm:w-44"
          >
            <option value="">All sections</option>
            {Array.from({ length: 10 }, (_, i) => (
              <option key={i + 1} value={i + 1}>Section {i + 1}</option>
            ))}
          </select>
        </div>
        <p className="text-sm text-gray-500 mt-2">{total} question(s) found</p>
      </div>

      {/* Questions table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <LoadingSpinner className="py-10" />
        ) : questions.length === 0 ? (
          <p className="text-center py-10 text-gray-400">No questions found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left text-gray-500 font-medium">ID</th>
                  <th className="py-3 px-4 text-left text-gray-500 font-medium">Sec</th>
                  <th className="py-3 px-4 text-left text-gray-500 font-medium">Question</th>
                  <th className="py-3 px-4 text-left text-gray-500 font-medium">Correct Answer</th>
                  <th className="py-3 px-4 text-left text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  editingId === q._id ? (
                    <tr key={q._id} className="border-b border-gray-50">
                      <td colSpan={5} className="px-4 py-4">
                        <QuestionForm
                          initial={{ section: q.section, questionText: q.questionText, options: [...q.options], correctAnswer: q.correctAnswer }}
                          onSave={handleUpdate}
                          onCancel={() => setEditingId(null)}
                        />
                      </td>
                    </tr>
                  ) : (
                    <tr key={q._id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-400 font-mono text-xs">{q.questionId}</td>
                      <td className="py-3 px-4"><span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs font-medium">S{q.section}</span></td>
                      <td className="py-3 px-4 max-w-xs text-gray-700">{q.questionText.slice(0, 80)}{q.questionText.length > 80 ? '…' : ''}</td>
                      <td className="py-3 px-4 text-green-700 font-medium text-xs">{String.fromCharCode(65 + q.correctAnswer)}. {q.options[q.correctAnswer]?.slice(0, 30)}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingId(q._id); setShowForm(false); }} className="text-primary-600 hover:underline text-xs font-medium">Edit</button>
                          <button onClick={() => handleDelete(q._id)} disabled={deleting === q._id} className="text-red-600 hover:underline text-xs font-medium">
                            {deleting === q._id ? '...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`w-9 h-9 rounded-lg text-sm font-medium ${page === i + 1 ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
