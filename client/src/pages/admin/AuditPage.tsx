import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge, Btn, Card, EmptyState, ErrorState, Field, PageHeader, Select, Spinner } from '@/components/admin/ui';
import { AUDIT_ACTIONS, errMsg, fmtDate, type AuditItem } from '@/lib/admin-api';
import { api } from '@/lib/api';

const LIMIT = 25;

export default function AuditPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  useEffect(() => {
    document.title = 'Audit log | MAOUAJ admin';
  }, []);
  const q = useQuery({
    queryKey: ['admin', 'audit', page, action],
    queryFn: () =>
      api<{ items: AuditItem[]; total: number }>(
        `/admin/audit?page=${page}&limit=${LIMIT}${action ? `&action=${encodeURIComponent(action)}` : ''}`,
      ),
    placeholderData: (prev) => prev,
  });
  const total = q.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <>
      <PageHeader title="Audit log" description="Sign-ins, password and user changes. Visible to admins only." />
      <div className="mb-4 max-w-xs">
        <Field label="Filter by action">
          <Select
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All actions</option>
            {AUDIT_ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      {q.isLoading ? (
        <Spinner />
      ) : q.isError || !q.data ? (
        <ErrorState message={errMsg(q.error)} onRetry={() => void q.refetch()} />
      ) : q.data.items.length === 0 ? (
        <Card>
          <EmptyState title="No events" text="Nothing has been recorded for this filter yet." />
        </Card>
      ) : (
        <>
          <Card className="hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-soft text-xs uppercase tracking-wider text-ink-700">
                  <tr>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Result</th>
                    <th className="px-4 py-3">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {q.data.items.map((i) => (
                    <tr key={i.id}>
                      <td className="whitespace-nowrap px-4 py-3 text-ink-700">{fmtDate(i.createdAt)}</td>
                      <td className="px-4 py-3 font-semibold text-ink">{i.email ?? 'unknown'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-ink-700">{i.action}</td>
                      <td className="px-4 py-3">
                        <Badge tone={i.success ? 'success' : 'warn'}>{i.success ? 'Success' : 'Failed'}</Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-ink-500">{i.ip ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <ul className="space-y-3 md:hidden" aria-label="Audit events">
            {q.data.items.map((i) => (
              <li key={i.id}>
                <Card className="space-y-1.5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="break-all font-mono text-xs font-bold text-ink">{i.action}</p>
                    <Badge tone={i.success ? 'success' : 'warn'}>{i.success ? 'Success' : 'Failed'}</Badge>
                  </div>
                  <p className="break-all text-sm font-semibold text-ink">{i.email ?? 'unknown'}</p>
                  <p className="text-xs text-ink-500">
                    {fmtDate(i.createdAt)} · {i.ip ?? 'no IP'}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
          <nav aria-label="Pagination" className="mt-5 flex items-center justify-between gap-3">
            <Btn variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              ← Previous
            </Btn>
            <p className="text-sm font-semibold text-ink-700" aria-live="polite">
              Page {page} of {pages} · {total} events
            </p>
            <Btn variant="secondary" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
              Next →
            </Btn>
          </nav>
        </>
      )}
    </>
  );
}
