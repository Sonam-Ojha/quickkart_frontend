import React, { useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Shield } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminUsersApi, AdminUser, UpdatePayload } from './api';
import { Button } from '../../components/ui/button';

const ROLES = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'ops_manager', label: 'Ops Manager' },
  { value: 'catalog_mgr', label: 'Catalog Manager' },
  { value: 'marketing',   label: 'Marketing' },
  { value: 'support',     label: 'Support' },
  { value: 'finance',     label: 'Finance' },
];

interface Props {
  admin: AdminUser | null;
  onClose: () => void;
}

export function EditAdminModal({ admin, onClose }: Props) {
  const qc = useQueryClient();
  const { register, handleSubmit, reset, watch } = useForm<UpdatePayload>();

  useEffect(() => {
    if (admin) reset({ role: admin.role, isActive: admin.isActive });
  }, [admin, reset]);

  const update = useMutation({
    mutationFn: (data: UpdatePayload) => adminUsersApi.update(admin!.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      onClose();
    },
  });

  const isActive = watch('isActive');

  return (
    <Dialog.Root open={!!admin} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-2xl shadow-xl p-6 focus:outline-none">

          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                <Shield size={16} className="text-[#0F766E]" />
              </div>
              <div>
                <Dialog.Title className="text-sm font-semibold text-slate-900">Edit Admin</Dialog.Title>
                <p className="text-xs text-slate-400">{admin?.name}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit((data) => update.mutate(data))} className="space-y-4">
            {/* Current info */}
            <div className="bg-slate-50 rounded-xl px-4 py-3 space-y-1">
              <p className="text-xs text-slate-500">Email</p>
              <p className="text-sm font-medium text-slate-800">{admin?.email}</p>
            </div>

            {/* Role */}
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1.5 block">Role</label>
              <select
                {...register('role')}
                className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:border-transparent"
              >
                {ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {/* Status toggle */}
            <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-700">Account Status</p>
                <p className="text-xs text-slate-400">{isActive ? 'Admin active hai' : 'Admin blocked hai'}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" {...register('isActive')} />
                <div className="w-9 h-5 bg-slate-200 peer-checked:bg-[#0F766E] rounded-full transition-colors peer-focus:ring-2 peer-focus:ring-[#0F766E]/20" />
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
              </label>
            </div>

            {update.isError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {(update.error as any)?.response?.data?.message || 'Something went wrong'}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="teal" className="flex-1" disabled={update.isPending}>
                {update.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
