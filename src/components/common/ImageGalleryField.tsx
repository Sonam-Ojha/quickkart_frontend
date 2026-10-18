import { useRef, useState } from 'react';
import { Upload, Link, X, Star, Loader2, AlertCircle } from 'lucide-react';
import api from '../../lib/api';

interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}

/**
 * Product gallery: upload several files at once or paste URLs. The first image
 * is the cover (shown on cards and lists); any other can be promoted to cover.
 * The customer app shows the whole list as a swipeable carousel.
 */
export default function ImageGalleryField({ value, onChange, max = 8 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState('');
  const [url, setUrl] = useState('');
  const full = value.length >= max;

  const add = (urls: string[]) =>
    onChange([...value, ...urls.filter(u => u && !value.includes(u))].slice(0, max));

  const uploadFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).slice(0, max - value.length);
    if (!list.length) return;
    setError('');
    setUploading(list.length);
    const done: string[] = [];
    for (const file of list) {
      try {
        const fd = new FormData();
        fd.append('image', file);
        const res = await api.post<{ url: string }>('/api/admin/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        done.push(res.data.url);
      } catch (e: any) {
        setError(e?.response?.data?.message ?? `Upload failed for ${file.name}`);
      } finally {
        setUploading(n => n - 1);
      }
    }
    add(done);
  };

  const addUrl = () => {
    const u = url.trim();
    if (!/^https?:\/\//i.test(u)) { setError('Enter a full image URL (https://…)'); return; }
    setError('');
    add([u]);
    setUrl('');
  };

  const remove = (i: number) => onChange(value.filter((_, j) => j !== i));
  const makeCover = (i: number) => onChange([value[i], ...value.filter((_, j) => j !== i)]);

  return (
    <div className="flex flex-col gap-3">
      {/* Thumbnails */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {value.map((src, i) => (
            <div key={src} className={`relative group aspect-square rounded-lg overflow-hidden border bg-white ${
              i === 0 ? 'border-[#EA580C] ring-1 ring-[#EA580C]' : 'border-slate-200'}`}>
              <img src={src} alt="" className="h-full w-full object-contain" />
              {i === 0 && (
                <span className="absolute left-1 top-1 rounded bg-[#EA580C] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  Cover
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {i !== 0 && (
                  <button type="button" title="Make cover" onClick={() => makeCover(i)}
                    className="rounded bg-white/90 p-1 text-amber-600 shadow hover:bg-white">
                    <Star size={12} />
                  </button>
                )}
                <button type="button" title="Remove" onClick={() => remove(i)}
                  className="rounded bg-white/90 p-1 text-red-600 shadow hover:bg-white">
                  <X size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload drop zone */}
      {!full && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); uploadFiles(e.dataTransfer.files); }}
          className="cursor-pointer rounded-lg border-2 border-dashed border-slate-200 bg-white px-3 py-5 text-center hover:border-orange-300 transition-colors"
        >
          {uploading > 0 ? (
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <Loader2 size={14} className="animate-spin" /> Uploading {uploading}…
            </div>
          ) : (
            <>
              <Upload size={18} className="mx-auto mb-1 text-slate-400" />
              <p className="text-xs text-slate-500">Click or drag images here — you can pick several</p>
              <p className="text-[11px] text-slate-400">JPG, PNG, WebP · max 5 MB each · {value.length}/{max}</p>
            </>
          )}
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden
            onChange={e => { if (e.target.files) uploadFiles(e.target.files); e.target.value = ''; }} />
        </div>
      )}

      {/* Or paste a URL */}
      {!full && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={url} onChange={e => setUrl(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }}
              placeholder="…or paste an image URL"
              className="w-full rounded-lg border border-slate-200 py-1.5 pl-7 pr-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400" />
          </div>
          <button type="button" onClick={addUrl} disabled={!url.trim()}
            className="rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:border-orange-300 disabled:opacity-40">
            Add
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle size={12} /> {error}
        </div>
      )}
      {value.length > 1 && (
        <p className="text-[11px] text-slate-400">The first image is the cover. Hover an image to make it the cover or remove it.</p>
      )}
    </div>
  );
}
