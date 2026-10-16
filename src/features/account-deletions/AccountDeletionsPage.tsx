import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trash2, User, Bike, Calendar, Phone } from 'lucide-react';
import api from '../../lib/api';

interface DeletionRecord {
  id: number;
  userId: number;
  userType: 'customer' | 'rider';
  mobile: string | null;
  name: string | null;
  reason: string | null;
  status: 'pending' | 'processed';
  created_at: string;
}

interface ApiResponse {
  total: number;
  page: number;
  data: DeletionRecord[];
}

export function AccountDeletionsPage() {
  const [filter, setFilter] = useState<'all' | 'customer' | 'rider'>('all');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<ApiResponse>({
    queryKey: ['account-deletions', filter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (filter !== 'all') params.set('type', filter);
      const res = await api.get(`/account-deletions?${params}`);
      return res.data;
    },
  });

  const totalPages = Math.ceil((data?.total ?? 0) / 20);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <Trash2 size={20} className="text-red-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Account Deletions</h1>
            <p className="text-sm text-gray-500">{data?.total ?? 0} total requests</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {(['all', 'customer', 'rider'] as const).map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                filter === f
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20 text-gray-400">Loading...</div>
      ) : !data?.data.length ? (
        <div className="text-center py-20 text-gray-400">No deletion requests found</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">#</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">User</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Type</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Mobile</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Reason</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.data.map(row => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-400">{row.id}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-600">
                          {(row.name ?? 'U')[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{row.name ?? '—'}</p>
                        <p className="text-xs text-gray-400">ID: {row.userId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      row.userType === 'customer'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-orange-50 text-orange-700'
                    }`}>
                      {row.userType === 'customer'
                        ? <User size={11} />
                        : <Bike size={11} />}
                      {row.userType}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-1 text-gray-600">
                      <Phone size={12} /> {row.mobile ?? '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3 max-w-xs">
                    <p className="text-gray-700 truncate" title={row.reason ?? ''}>
                      {row.reason || <span className="text-gray-400 italic">No reason provided</span>}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-1 text-gray-500 text-xs">
                      <Calendar size={11} />
                      {new Date(row.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200">
              <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 text-gray-600 disabled:opacity-40"
                >Prev</button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 text-gray-600 disabled:opacity-40"
                >Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
