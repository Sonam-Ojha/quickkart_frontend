import { Download, FileText, Printer } from 'lucide-react';
import { PrintJob } from './api';

/** Print-order details in the order drawer: settings, then each file with a
 *  link to open/download it for printing at the store. */
export function PrintJobSection({ job }: { job: PrintJob }) {
  const settings = [
    job.color === 'color' ? 'Color' : 'Black & White',
    job.paper,
    job.sides === 'double' ? 'Double sided' : 'Single sided',
    `${job.copies} ${job.copies === 1 ? 'copy' : 'copies'}`,
  ];
  return (
    <section className="rounded-xl border border-orange-200 bg-orange-50/40 p-4">
      <h3 className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#C2410C]">
        <Printer size={12} /> Print job · {job.files.length} file{job.files.length === 1 ? '' : 's'} · {job.totalPages} page{job.totalPages === 1 ? '' : 's'}
      </h3>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {settings.map(s => (
          <span key={s} className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-orange-200">{s}</span>
        ))}
      </div>
      <div className="space-y-2">
        {job.files.map((f, i) => (
          <a
            key={`${f.url}-${i}`}
            href={f.url}
            target="_blank"
            rel="noopener noreferrer"
            download={f.name}
            className="flex items-center gap-3 rounded-lg bg-white p-2.5 ring-1 ring-slate-200 transition-colors hover:ring-orange-300"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
              <FileText size={14} className="text-slate-500" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-slate-700">{f.name}</div>
              <div className="text-xs text-slate-400">{f.pages} page{f.pages === 1 ? '' : 's'}</div>
            </div>
            <Download size={15} className="shrink-0 text-[#EA580C]" />
          </a>
        ))}
      </div>
    </section>
  );
}
