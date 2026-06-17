import { Download, FileDown, FileText, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';
import { api, apiErrorMessage } from '../api/client.js';

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function ReportsPanel({ reports = [], onChanged }) {
  const [form, setForm] = useState({ title: '', category: 'lab', notes: '', file: null });
  const [status, setStatus] = useState('');

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const upload = async (event) => {
    event.preventDefault();
    if (!form.file) {
      setStatus('Choose a PDF, JPG, or PNG report');
      return;
    }
    if (form.file.size > 10 * 1024 * 1024) {
      setStatus('Report must be 10MB or smaller');
      return;
    }

    setStatus('Uploading...');
    try {
      const data = new FormData();
      data.append('title', form.title || form.file.name);
      data.append('category', form.category);
      data.append('notes', form.notes);
      data.append('report', form.file);
      await api.post('/reports', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm({ title: '', category: 'lab', notes: '', file: null });
      event.target.reset();
      setStatus('Report uploaded');
      onChanged?.();
    } catch (error) {
      setStatus(apiErrorMessage(error, 'Could not upload report'));
    }
  };

  const downloadReport = async (report) => {
    setStatus('Downloading report...');
    try {
      const { data } = await api.get(`/reports/${report._id}/download`, { responseType: 'blob' });
      downloadBlob(data, report.originalName || report.fileName);
      setStatus('Report downloaded');
    } catch (error) {
      setStatus(apiErrorMessage(error, 'Could not download report'));
    }
  };

  const exportPdf = async () => {
    setStatus('Creating PDF...');
    try {
      const { data } = await api.get('/reports/health/export', { responseType: 'blob' });
      downloadBlob(data, `pcodcare-health-report-${new Date().toISOString().slice(0, 10)}.pdf`);
      setStatus('Health PDF exported');
    } catch (error) {
      setStatus(apiErrorMessage(error, 'Could not export PDF'));
    }
  };

  const remove = async (report) => {
    setStatus('Deleting report...');
    try {
      await api.delete(`/reports/${report._id}`);
      setStatus('Report deleted');
      onChanged?.();
    } catch (error) {
      setStatus(apiErrorMessage(error, 'Could not delete report'));
    }
  };

  return (
    <div>
      <div className="section-heading page-heading">
        <div>
          <p className="eyebrow">Medical vault</p>
          <h2>Secure reports and PDF export</h2>
        </div>
        <button className="secondary-button" type="button" onClick={exportPdf}>
          <FileDown size={16} />
          Export health PDF
        </button>
      </div>

      <div className="two-column">
        <section className="card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Upload</p>
              <h2>Medical report</h2>
            </div>
            <Upload size={20} />
          </div>
          <form className="compact-form" onSubmit={upload}>
            <label>
              Title
              <input value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="Hormone panel" />
            </label>
            <label>
              Category
              <select value={form.category} onChange={(event) => update('category', event.target.value)}>
                <option value="lab">Lab</option>
                <option value="ultrasound">Ultrasound</option>
                <option value="prescription">Prescription</option>
                <option value="consultation">Consultation</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="full-span">
              Report file
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                onChange={(event) => update('file', event.target.files?.[0] || null)}
              />
            </label>
            <label className="full-span">
              Notes
              <textarea value={form.notes} onChange={(event) => update('notes', event.target.value)} />
            </label>
            <button className="primary-button full-span" type="submit">
              <Upload size={16} />
              Upload report
            </button>
            {status ? <span className="form-status full-span">{status}</span> : null}
          </form>
        </section>

        <section className="card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Library</p>
              <h2>Saved reports</h2>
            </div>
            <FileText size={20} />
          </div>

          <div className="report-list">
            {reports.length ? (
              reports.map((report) => (
                <article className="report-row" key={report._id}>
                  <div>
                    <strong>{report.title}</strong>
                    <span>{report.category} - {(report.size / (1024 * 1024)).toFixed(2)} MB</span>
                    {report.notes ? <p>{report.notes}</p> : null}
                  </div>
                  <div className="row-actions">
                    <button className="icon-button" type="button" onClick={() => downloadReport(report)} title="Download">
                      <Download size={17} />
                    </button>
                    <button className="icon-button danger" type="button" onClick={() => remove(report)} title="Delete">
                      <Trash2 size={17} />
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="muted-card">No medical reports uploaded yet.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
