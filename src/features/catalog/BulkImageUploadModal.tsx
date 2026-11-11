import React, { useState, useRef, useCallback } from 'react';
import { X, Upload, CheckCircle2, AlertCircle, Loader2, ImageIcon, XCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import api from '../../lib/api';

interface UploadResult {
  file: string;
  status: 'ok' | 'no_match' | 'error';
  productId?: number;
  productName?: string;
  imageUrl?: string;
  message?: string;
}

interface Props { onClose: () => void; onDone: () => void }

export default function BulkImageUploadModal({ onClose, onDone }: Props) {
  const [files, setFiles]       = useState<File[]>([]);
  const [results, setResults]   = useState<UploadResult[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles).filter(f => f.type.startsWith('image/'));
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      return [...prev, ...arr.filter(f => !existing.has(f.name))];
    });
    setResults(null);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  }, []);

  const removeFile = (name: string) => setFiles(prev => prev.filter(f => f.name !== name));

  const handleUpload = async () => {
    if (!files.length) return;
    setUploading(true);
    const form = new FormData();
    files.forEach(f => form.append('images', f));
    try {
      const { data } = await api.post('/api/admin/catalog/products/bulk-upload-images', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResults(data.results);
      onDone();
    } catch (err: any) {
      setResults([{ file: 'Upload failed', status: 'error', message: err?.response?.data?.message ?? 'Server error' }]);
    } finally {
      setUploading(false);
    }
  };

  const okCount  = results?.filter(r => r.status === 'ok').length ?? 0;
  const failCount = results?.filter(r => r.status !== 'ok').length ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <p className="font-semibold text-slate-800">Bulk Image Upload</p>
            <p className="text-xs text-slate-400 mt-0.5">File name = Product ID or Product Name</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>

        <div className="p-5 flex flex-col gap-4 overflow-y-auto flex-1">

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 space-y-1">
            <p className="font-semibold">How to name your files:</p>
            <p>• <span className="font-mono bg-white px-1 rounded">142.jpg</span> → Product ID 142 ki image update hogi</p>
            <p>• <span className="font-mono bg-white px-1 rounded">Bikano Punjabi Tadka.jpg</span> → Name se match hoga</p>
            <p>• JPG, PNG, WebP — max 5MB per file</p>
          </div>

          {/* Drop zone */}
          {!results && (
            <div
              onDrop={onDrop}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                dragOver ? 'border-[#EA580C] bg-orange-50' : 'border-slate-200 hover:border-orange-300 hover:bg-slate-50'
              }`}
            >
              <Upload size={28} className="mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">Drag & drop images here</p>
              <p className="text-xs text-slate-400 mt-1">or click to select</p>
              <input ref={inputRef} type="file" multiple accept="image/*" className="hidden"
                onChange={e => e.target.files && addFiles(e.target.files)} />
            </div>
          )}

          {/* File list */}
          {files.length > 0 && !results && (
            <div className="space-y-1.5 max-h-52 overflow-y-auto">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{files.length} files selected</p>
              {files.map(f => (
                <div key={f.name} className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-lg">
                  <ImageIcon size={14} className="text-slate-400 shrink-0" />
                  <span className="flex-1 text-sm text-slate-700 truncate">{f.name}</span>
                  <span className="text-xs text-slate-400">{(f.size / 1024).toFixed(0)} KB</span>
                  <button onClick={() => removeFile(f.name)} className="text-slate-300 hover:text-red-400">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-2">
              <div className="flex gap-3 text-sm font-semibold">
                <span className="text-green-600 flex items-center gap-1"><CheckCircle2 size={14} /> {okCount} updated</span>
                {failCount > 0 && <span className="text-red-500 flex items-center gap-1"><XCircle size={14} /> {failCount} failed</span>}
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {results.map((r, i) => (
                  <div key={i} className={`flex items-start gap-3 px-3 py-2.5 rounded-lg ${
                    r.status === 'ok' ? 'bg-green-50' : r.status === 'no_match' ? 'bg-yellow-50' : 'bg-red-50'
                  }`}>
                    {r.status === 'ok'
                      ? <CheckCircle2 size={14} className="text-green-600 mt-0.5 shrink-0" />
                      : r.status === 'no_match'
                      ? <AlertCircle size={14} className="text-yellow-600 mt-0.5 shrink-0" />
                      : <XCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{r.file}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {r.status === 'ok' ? `✓ ${r.productName} (ID: ${r.productId})` : r.message}
                      </p>
                    </div>
                    {r.imageUrl && (
                      <img src={r.imageUrl} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-100">
          {results ? (
            <Button onClick={onClose}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleUpload} disabled={uploading || files.length === 0}>
                {uploading ? <><Loader2 size={14} className="animate-spin" /> Uploading…</> : <><Upload size={14} /> Upload {files.length > 0 ? `${files.length} Images` : 'Images'}</>}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
