import React, { useState, useEffect, useCallback } from 'react';
import { X, Loader2, Check, FileText, ExternalLink, AlertCircle, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { riderApi, Rider, RiderDocument, REQUIRED_DOCS, DOC_LABEL } from './api';

const DOC_BADGE: Record<string, string> = {
  verified: 'bg-green-50 text-green-700',
  uploaded: 'bg-amber-50 text-amber-700',
  rejected: 'bg-red-50 text-red-600',
};

/** Reviews one rider's KYC. Verifying the last required document activates
 *  the rider server-side; `onChanged` refreshes the list behind the modal. */
export function KycModal({ rider, onClose, onChanged }: {
  rider: Rider;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [docs, setDocs] = useState<RiderDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<number | null>(null);
  const [rejecting, setRejecting] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState(rider.status);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      setDocs(await riderApi.documents(rider.id));
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Could not load documents');
    } finally {
      setLoading(false);
    }
  }, [rider.id]);

  useEffect(() => { load(); }, [load]);

  const review = async (
    doc: RiderDocument,
    body: { status: 'verified' } | { status: 'rejected'; rejectionReason: string },
  ) => {
    setBusy(doc.id); setError('');
    try {
      const res = await riderApi.reviewDocument(rider.id, doc.id, body);
      setStatus(res.riderStatus);
      setRejecting(null); setReason('');
      await load();
      onChanged();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Could not update the document');
    } finally {
      setBusy(null);
    }
  };

  // Uploaded-but-unreviewed rows are what the admin is here for.
  const missing = REQUIRED_DOCS.filter(t => !docs.some(d => d.docType === t));
  const verifiedCount = REQUIRED_DOCS.filter(
    t => docs.find(d => d.docType === t)?.status === 'verified').length;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">KYC — {rider.name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {rider.mobile} · {verifiedCount}/{REQUIRED_DOCS.length} verified
              <span className={`ml-2 px-2 py-0.5 rounded-full font-medium ${
                status === 'active' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                {status}
              </span>
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <div className="p-5 overflow-y-auto space-y-3">
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              <AlertCircle size={14} />{error}
            </div>
          )}

          {status === 'active' && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
              <ShieldCheck size={14} /> All required documents cleared — this rider can take orders.
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 size={20} className="animate-spin mr-2" /> Loading documents…
            </div>
          ) : docs.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText size={32} className="mx-auto mb-2 text-slate-200" />
              <p className="text-sm">This rider hasn’t uploaded anything yet.</p>
            </div>
          ) : docs.map(doc => (
            <div key={doc.id} className="border border-slate-100 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                  <FileText size={16} className="text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-800 text-sm">
                    {DOC_LABEL[doc.docType] ?? doc.docType}
                  </div>
                  <a href={doc.fileUrl} target="_blank" rel="noreferrer"
                    className="text-xs text-[#EA580C] hover:underline inline-flex items-center gap-1">
                    Open file <ExternalLink size={10} />
                  </a>
                  {doc.status === 'rejected' && doc.rejectionReason && (
                    <p className="text-xs text-red-600 mt-1">Rejected: {doc.rejectionReason}</p>
                  )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${DOC_BADGE[doc.status]}`}>
                  {doc.status}
                </span>
              </div>

              {/* A verified doc stays verified; re-reviewing it is not a thing
                  the backend supports, so only offer actions where they apply. */}
              {doc.status !== 'verified' && (
                rejecting === doc.id ? (
                  <div className="mt-3 flex gap-2">
                    <input autoFocus value={reason} onChange={e => setReason(e.target.value)}
                      placeholder="Why is it being rejected?"
                      className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400" />
                    <Button size="sm" variant="outline" className="text-red-600"
                      disabled={!reason.trim() || busy === doc.id}
                      onClick={() => review(doc, { status: 'rejected', rejectionReason: reason.trim() })}>
                      {busy === doc.id ? <Loader2 size={12} className="animate-spin" /> : 'Confirm'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setRejecting(null); setReason(''); }}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" className="flex-1" disabled={busy === doc.id}
                      onClick={() => review(doc, { status: 'verified' })}>
                      {busy === doc.id ? <Loader2 size={12} className="animate-spin" /> : <><Check size={12} /> Verify</>}
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600"
                      disabled={busy === doc.id} onClick={() => setRejecting(doc.id)}>
                      Reject
                    </Button>
                  </div>
                )
              )}
            </div>
          ))}

          {!loading && missing.length > 0 && (
            <div className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
              Still waiting on: {missing.map(t => DOC_LABEL[t]).join(', ')}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
