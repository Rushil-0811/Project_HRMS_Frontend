import { useState, useEffect } from 'react';
import { FileText, Eye, Trash2, X, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import client from '../../api/client';

// ── helpers ───────────────────────────────────────────────────────────────────
const getMimeType = (b64) => {
  if (!b64) return null;
  if (b64.startsWith('/9j/') || b64.startsWith('FFD8FF')) return 'image/jpeg';
  if (b64.startsWith('iVBORw0KGgo'))                       return 'image/png';
  if (b64.startsWith('JVBER'))                             return 'application/pdf';
  return 'application/octet-stream';
};

const PAGE_SIZES = [5, 10, 20, 50];

// ── Doc Viewer Modal ──────────────────────────────────────────────────────────
const DocViewer = ({ file, mimeType, onClose }) => {
  const bytes = Uint8Array.from(atob(file), c => c.charCodeAt(0));
  const url   = URL.createObjectURL(new Blob([bytes], { type: mimeType }));
  useEffect(() => () => URL.revokeObjectURL(url), []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-surface-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-0 rounded-2xl shadow-card-md w-full max-w-3xl h-[85vh] flex flex-col animate-slide-down">
        <div className="flex items-center justify-between px-5 py-3 border-b border-surface-100 flex-shrink-0">
          <p className="font-semibold text-surface-800 text-sm">Document Preview</p>
          <div className="flex items-center gap-2">
            {mimeType !== 'application/pdf' && (
              <a href={url} download="document" className="btn-secondary text-xs py-1.5 px-3">Download</a>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400"><X size={15} /></button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden rounded-b-2xl">
          {mimeType?.startsWith('image/')
            ? <img src={url} alt="Document" className="w-full h-full object-contain bg-surface-50" />
            : mimeType === 'application/pdf'
            ? <iframe src={url} className="w-full h-full border-0" title="Document" />
            : <div className="flex items-center justify-center h-full text-surface-400 text-sm">Unsupported file type</div>
          }
        </div>
      </div>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const DocumentDetails = () => {
  const [docs,       setDocs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(0);
  const [pageSize,   setPageSize]   = useState(10);
  const [total,      setTotal]      = useState(0);
  const [viewer,     setViewer]     = useState(null); // { file, mimeType }
  const [deleting,   setDeleting]   = useState(null);
  const [search,     setSearch]     = useState('');

  const fetchDocs = async (pg = page, ps = pageSize) => {
    setLoading(true);
    try {
      const res = await client.get(`/api/upload/getByReferenceNumber`, {
        params: { page: pg, size: ps }
      });
      setDocs(res.data?.content || []);
      setTotal(res.data?.totalElements || 0);
    } catch { setDocs([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDocs(page, pageSize); }, [page, pageSize]);

  const handleView = (doc) => {
    if (!doc.docBlob) return;
    const mimeType = getMimeType(doc.docBlob);
    setViewer({ file: doc.docBlob, mimeType });
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete "${doc.documentName}"? This cannot be undone.`)) return;
    setDeleting(doc.id);
    try {
      await client.delete('/hrms/api/v1/file/delete-documents', {
        params: { id: doc.id }
      });
      fetchDocs(page, pageSize);
    } catch (e) {
      console.error(e);
    } finally { setDeleting(null); }
  };

  const totalPages = Math.ceil(total / pageSize);

  const filtered = docs.filter(d =>
    !search ||
    d.documentName?.toLowerCase().includes(search.toLowerCase()) ||
    d.documentType?.toLowerCase().includes(search.toLowerCase()) ||
    d.referenceNumber?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Document Details</h1>
          <p className="page-subtitle">{total} documents on record</p>
        </div>
      </div>

      {/* Search + page size */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            className="input pl-8"
            placeholder="Search name, type, reference…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input w-auto text-sm" value={pageSize}
          onChange={e => { setPageSize(Number(e.target.value)); setPage(0); }}>
          {PAGE_SIZES.map(s => <option key={s} value={s}>{s} per page</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-surface-100 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <FileText size={32} className="text-surface-300 mb-3" />
          <p className="text-surface-500 text-sm">{search ? 'No documents match your search.' : 'No documents found.'}</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Document Name</th>
                <th>Type</th>
                <th>Location</th>
                <th>File</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc, i) => {
                const mime = getMimeType(doc.docBlob);
                return (
                  <tr key={i}>
                    <td className="font-mono text-xs">{doc.referenceNumber || '—'}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                          <FileText size={13} className="text-primary-500" />
                        </div>
                        <span className="font-medium">{doc.documentName || '—'}</span>
                      </div>
                    </td>
                    <td><span className="badge-blue">{doc.documentType || '—'}</span></td>
                    <td>{doc.docLocation || '—'}</td>
                    <td>
                      {doc.docBlob ? (
                        <button
                          onClick={() => handleView(doc)}
                          className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700"
                        >
                          <Eye size={13} />
                          {mime?.startsWith('image/') ? 'View Image' : mime === 'application/pdf' ? 'View PDF' : 'View File'}
                        </button>
                      ) : (
                        <span className="text-surface-400 text-xs">No file</span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => handleDelete(doc)}
                        disabled={deleting === doc.id}
                        className="p-1.5 rounded-lg text-surface-400 hover:bg-red-50 hover:text-danger transition-colors disabled:opacity-40"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
          <span className="text-xs text-surface-400">Page {page + 1} of {totalPages} · {total} total</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(0)} disabled={page === 0} className="btn-ghost px-2 py-1.5 text-xs disabled:opacity-40">«</button>
            <button onClick={() => setPage(p => p - 1)} disabled={page === 0} className="btn-ghost px-2 py-1.5 text-xs disabled:opacity-40">
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(0, Math.min(page - 2, totalPages - 5));
              const pg    = start + i;
              return (
                <button key={pg} onClick={() => setPage(pg)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${pg === page ? 'bg-primary-600 text-white' : 'text-surface-600 hover:bg-surface-100'}`}>
                  {pg + 1}
                </button>
              );
            })}
            <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1} className="btn-ghost px-2 py-1.5 text-xs disabled:opacity-40">
              <ChevronRight size={14} />
            </button>
            <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1} className="btn-ghost px-2 py-1.5 text-xs disabled:opacity-40">»</button>
          </div>
        </div>
      )}

      {viewer && <DocViewer file={viewer.file} mimeType={viewer.mimeType} onClose={() => setViewer(null)} />}
    </div>
  );
};

export default DocumentDetails;