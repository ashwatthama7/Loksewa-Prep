import { useState, useRef } from 'react';
import { bulkUpload } from '../../api/admin';
import { Link } from 'react-router-dom';

const CSV_TEMPLATE = `section,questionText,option1,option2,option3,option4,correctAnswer
1,"What is 2+2?","3","4","5","6",1
2,"What is H2O?","Water","Oxygen","Hydrogen","Salt",0`;

export default function AdminBulkUploadPage() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await bulkUpload(formData);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'questions_template.csv';
    a.click();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Bulk Upload Questions</h1>
        <Link to="/admin/questions" className="btn-secondary">← Questions</Link>
      </div>

      {/* Instructions */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-3">File Format</h2>
        <p className="text-sm text-gray-600 mb-3">
          Upload a <strong>CSV</strong> or <strong>JSON</strong> file. Each row/object must have:
        </p>
        <ul className="text-sm text-gray-600 space-y-1 mb-4 list-disc list-inside">
          <li><code className="bg-gray-100 px-1 rounded">section</code> — integer 1–10</li>
          <li><code className="bg-gray-100 px-1 rounded">questionText</code> — the question</li>
          <li><code className="bg-gray-100 px-1 rounded">option1</code> to <code className="bg-gray-100 px-1 rounded">option4</code> — four options (or <code>options</code> array in JSON)</li>
          <li><code className="bg-gray-100 px-1 rounded">correctAnswer</code> — index 0–3</li>
        </ul>
        <button onClick={downloadTemplate} className="btn-secondary text-sm">
          ↓ Download CSV Template
        </button>
      </div>

      {/* Upload area */}
      <div className="card">
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-400 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.json"
            className="hidden"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <p className="text-4xl mb-3">📁</p>
          <p className="text-gray-600 font-medium">{file ? file.name : 'Click to select CSV or JSON file'}</p>
          <p className="text-gray-400 text-sm mt-1">Max file size: 5MB</p>
        </div>

        {file && (
          <div className="mt-4">
            <button onClick={handleUpload} disabled={uploading} className="btn-primary w-full">
              {uploading ? 'Uploading...' : 'Upload & Process'}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
      )}

      {result && (
        <div className="card space-y-4">
          <div className="flex items-center gap-3">
            <span className={`text-2xl ${result.created > 0 ? '✅' : '⚠️'}`}>
              {result.created > 0 ? '✅' : '⚠️'}
            </span>
            <div>
              <p className="font-semibold text-gray-800">{result.message}</p>
              <p className="text-sm text-gray-500">{result.created} created, {result.rejected.length} rejected</p>
            </div>
          </div>

          {result.rejected.length > 0 && (
            <div>
              <h3 className="font-medium text-red-700 mb-2">Rejected Rows:</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-gray-100">
                      <th className="pb-2 pr-4 text-gray-500">Row</th>
                      <th className="pb-2 text-gray-500">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.rejected.map((r, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="py-2 pr-4 text-gray-600">{r.row}</td>
                        <td className="py-2 text-red-600">{r.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
