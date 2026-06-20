import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Copy, Check, UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminUsersApi, InvitePayload } from './api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

const ROLES = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'ops_manager', label: 'Ops Manager' },
  { value: 'catalog_mgr', label: 'Catalog Manager' },
  { value: 'marketing',   label: 'Marketing' },
  { value: 'support',     label: 'Support' },
  { value: 'finance',     label: 'Finance' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function InviteAdminModal({ open, onClose }: Props) {
  const qc = useQueryClient();
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<InvitePayload>({
    defaultValues: { role: 'support' },
  });

  const invite = useMutation({
    mutationFn: adminUsersApi.invite,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      setTempPassword(data.tempPassword);
    },
  });

  const handleClose = () => {
    reset();
    setTempPassword(null);
    setCopied(false);
    invite.reset();
    onClose();
  };

  const copy = () => {
    if (!tempPassword) return;
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-2xl shadow-xl p-6 focus:outline-none">

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                <UserPlus size={16} className="text-[#EA580C]" />
              </div>
              <div>
                <Dialog.Title className="text-sm font-semibold text-slate-900">Invite Admin</Dialog.Title>
                <p className="text-xs text-slate-400">New admin ka account banao</p>
              </div>
            </div>
            <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Success state — show temp password */}
          {tempPassword ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                  <Check size={18} className="text-green-600" />
                </div>
                <p className="text-sm font-semibold text-green-800 mb-0.5">Admin invited successfully!</p>
                <p className="text-xs text-green-600">Temporary password share karo</p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 mb-1.5">Temporary Password</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-800 select-all">
                    {tempPassword}
                  </code>
                  <button
                    onClick={copy}
                    className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-slate-500"
                  >
                    {copied ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1.5">Admin will be required to change their password on first login</p>
              </div>

              <Button onClick={handleClose} className="w-full" variant="outline">Done</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit((data) => invite.mutate(data))} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">Full Name *</label>
                <Input
                  placeholder="Priya Sharma"
                  {...register('name', { required: 'Name is required' })}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">Email Address *</label>
                <Input
                  type="email"
                  placeholder="priya@quickkart.app"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' },
                  })}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">Role *</label>
                <select
                  {...register('role', { required: true })}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:border-transparent"
                >
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              {invite.isError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {(invite.error as any)?.response?.data?.message || 'Something went wrong'}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={invite.isPending}>
                  {invite.isPending ? 'Inviting...' : 'Send Invite'}
                </Button>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
