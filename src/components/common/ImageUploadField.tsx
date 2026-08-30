import { useRef, useState } from 'react';
import { Upload, Link, X, Image as ImageIcon } from 'lucide-react';
import api from '../../lib/api';

interface Props {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  required?: boolean;
}

/**
 * Dual-mode image field: paste a URL OR upload a file.
 * Only one can be active at a time. Displays a live preview.
 */
export default function ImageUploadField({ value, onChange, label = 'Image', required }: Props) {
  const [mode, setMode] = useState<'url' | 'upload'>(value ? 'url' : 'url');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const switchMode = (m: 'url' | 'upload') => {
    setMode(m);
    setError('');
    if (m === 'upload') onChange(''); // clear URL when switching to upload
  };

  const handleFile = async (file: File) => {
    setError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post<{ url: string }>('/api/admin/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange(res.data.url);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Label + mode toggle */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-600">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <div className="flex rounded-md border border-slate-200 overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => switchMode('url')}
            className={`px-2.5 py-1 flex items-center gap-1 transition-colors ${
              mode === 'url' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Link size={11} /> URL
          </button>
          <button
            type="button"
            onClick={() => switchMode('upload')}
            className={`px-2.5 py-1 flex items-center gap-1 transition-colors ${
              mode === 'upload' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Upload size={11} /> Upload
          </button>
        </div>
      </div>

      {/* URL mode */}
      {mode === 'url' && (
        <div className="relative">
          <input
            type="url"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* Upload mode */}
      {mode === 'upload' && (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-500">Uploading…</span>
            </div>
          ) : value ? (
            <div className="flex items-center gap-2 justify-center text-xs text-green-600">
              <ImageIcon size={14} />
              <span className="truncate max-w-[200px]">{value.split('/').pop()}</span>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); onChange(''); }}
                className="text-slate-400 hover:text-red-500"
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 py-2">
              <Upload size={20} className="text-slate-300" />
              <span className="text-xs text-slate-400">Click or drag image here</span>
              <span className="text-[10px] text-slate-300">JPG, PNG, GIF, WebP · max 5 MB</span>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Live preview */}
      {value && (
        <div className="mt-1 rounded-lg overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center h-28">
          <img
            src={value}
            alt="preview"
            className="max-h-full max-w-full object-contain"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}
    </div>
  );
}
