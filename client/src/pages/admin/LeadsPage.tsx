import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '@/components/admin/Modal';
import { Badge, Btn, Card, EmptyState, ErrorState, PageHeader, Select, Spinner } from '@/components/admin/ui';
import { useAdminMutation } from '@/hooks/useAdminMutation';
import { useConfirm } from '@/hooks/useConfirm';
import { useToast } from '@/hooks/useToast';
import { downloadLeadsCsv, errMsg, fmtDate, type Lead } from '@/lib/admin-api';
import { api } from '@/lib/api';

const statusBadge = (s: Lead['status']) => <Badge tone={s === 'NEW' ? 'warn' : 'success'}>{s === 'NEW' ? 'New' : 'Contacted'}</Badge>;

export default function LeadsPage() {
  const [filter, setFilter] = useState('');
  const [open, setOpen] = useState<Lead | null>(null);
  const confirm = useConfirm();
  const toast = useToast();
  const q = useQuery({
    queryKey: ['admin', 'leads', filter],
    queryFn: () => api<Lead[]>(`/admin/leads${filter ? `?status=${filter}` : ''}`),
  });

  const setStatus = useAdminMutation(
    ({ id, status }: { id: string; status: Lead['status'] }) =>
      api<Lead>(`/admin/leads/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    'Lead updated',
    (_r, v) => setOpen((o) => (o && o.id === v.id ? { ...o, status: v.status } : o)),
  );
  const del = useAdminMutation(
    (id: string) => api(`/admin/leads/${id}`, { method: 'DELETE' }),
    'Lead deleted',
    () => setOpen(null),
  );

  const remove = async (l: Lead) => {
    if (await confirm({ title: 'Delete lead?', message: `The inquiry from ${l.name} will be permanently deleted.` })) del.mutate(l.id);
  };
  const exportCsv = async () => {
    try {
      await downloadLeadsCsv();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const leads = q.data ?? [];
  return (
    <>
      <PageHeader
        title="Leads inbox"
        description="Inquiries submitted through the Contact Us form."
        actions={
          <>
            <label className="flex items-center gap-2 text-sm font-semibold text-ink-700">
              Status
              <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="!w-auto">
                <option value="">All</option>
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
              </Select>
            </label>
            <Btn variant="secondary" onClick={() => void exportCsv()}>
              Export CSV
            </Btn>
          </>
        }
      />
      <Card className="overflow-hidden">
        {q.isLoading ? (
          <Spinner />
        ) : q.isError ? (
          <ErrorState message={errMsg(q.error)} onRetry={() => void q.refetch()} />
        ) : leads.length === 0 ? (
          <EmptyState title="No leads" text={filter ? 'No leads match this filter.' : 'Inquiries from the website will appear here.'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Leads</caption>
              <thead className="bg-surface-soft text-xs uppercase tracking-wider text-ink-700">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="hidden px-4 py-3 md:table-cell">Interest</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="hidden px-4 py-3 lg:table-cell">Received</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {leads.map((l) => (
                  <tr key={l.id} className={l.status === 'NEW' ? 'bg-brand/[0.03]' : ''}>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => setOpen(l)} className="font-bold text-ink hover:text-brand hover:underline">
                        {l.name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-ink-700">{l.email}</td>
                    <td className="hidden px-4 py-3 text-ink-700 md:table-cell">{l.interest ?? '—'}</td>
                    <td className="px-4 py-3">{statusBadge(l.status)}</td>
                    <td className="hidden px-4 py-3 text-ink-500 lg:table-cell">{fmtDate(l.createdAt)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Btn size="sm" variant="ghost" onClick={() => setOpen(l)}>
                        View
                      </Btn>
                      {l.status === 'NEW' && (
                        <Btn size="sm" variant="ghost" onClick={() => setStatus.mutate({ id: l.id, status: 'CONTACTED' })}>
                          Mark contacted
                        </Btn>
                      )}
                      <Btn size="sm" variant="ghost" className="!text-danger hover:!bg-danger-soft" onClick={() => void remove(l)}>
                        Delete
                      </Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {open && (
        <Modal title="Lead details" onClose={() => setOpen(null)}>
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            {(
              [
                ['Name', open.name],
                ['Email', open.email],
                ['Phone', open.phone],
                ['Organisation', open.organisation],
                ['Area of interest', open.interest],
                ['Received', fmtDate(open.createdAt)],
              ] as const
            ).map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs font-bold uppercase tracking-wider text-ink-500">{k}</dt>
                <dd className="mt-0.5 break-words font-semibold text-ink">{v || '—'}</dd>
              </div>
            ))}
            <div className="sm:col-span-2">
              <dt className="text-xs font-bold uppercase tracking-wider text-ink-500">Message</dt>
              <dd className="mt-1 whitespace-pre-wrap rounded-xl bg-surface-soft p-3 text-ink-700">{open.message}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-ink-500">Status</dt>
              <dd className="mt-1">{statusBadge(open.status)}</dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-line pt-4">
            <a
              href={`mailto:${open.email}`}
              className="inline-flex items-center rounded-xl border border-line px-4 py-2.5 text-sm font-bold text-ink hover:bg-surface-soft"
            >
              Reply by email
            </a>
            <Btn variant="secondary" onClick={() => setStatus.mutate({ id: open.id, status: open.status === 'NEW' ? 'CONTACTED' : 'NEW' })}>
              {open.status === 'NEW' ? 'Mark contacted' : 'Mark as new'}
            </Btn>
            <Btn variant="danger" onClick={() => void remove(open)}>
              Delete
            </Btn>
          </div>
        </Modal>
      )}
    </>
  );
}
