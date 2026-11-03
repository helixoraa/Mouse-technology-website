import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Badge, Card, EmptyState, ErrorState, PageHeader, Spinner } from '@/components/admin/ui';
import { fmtDate, errMsg, type Stats } from '@/lib/admin-api';
import { api } from '@/lib/api';

const contentLabels: Record<string, { label: string; to: string }> = {
  sections: { label: 'Page sections', to: '/admin/sections' },
  services: { label: 'Services & projects', to: '/admin/services' },
  team: { label: 'Team members', to: '/admin/team' },
  faqs: { label: 'FAQs', to: '/admin/faqs' },
  posts: { label: 'Blog posts', to: '/admin/posts' },
  testimonials: { label: 'Testimonials', to: '/admin/testimonials' },
  media: { label: 'Media files', to: '/admin/media' },
  users: { label: 'Users', to: '/admin/users' },
};

function Stat({ label, value, to, tone }: { label: string; value: number; to: string; tone?: boolean }) {
  return (
    <Link to={to} className="block rounded-2xl border border-line bg-white p-5 shadow-card transition-colors hover:border-brand">
      <p className="text-xs font-bold uppercase tracking-wider text-ink-500">{label}</p>
      <p className={`mt-2 text-4xl font-extrabold tracking-tight ${tone ? 'text-brand' : 'text-ink'}`}>{value}</p>
    </Link>
  );
}

export default function DashboardPage() {
  const q = useQuery({ queryKey: ['admin', 'stats'], queryFn: () => api<Stats>('/admin/stats') });
  if (q.isLoading) return <Spinner />;
  if (q.isError || !q.data) return <ErrorState message={errMsg(q.error)} onRetry={() => void q.refetch()} />;
  const { leads, recentLeads, content } = q.data;
  return (
    <>
      <PageHeader title="Dashboard" description="An overview of inquiries and website content." />
      <section aria-label="Lead statistics" className="grid gap-4 sm:grid-cols-3">
        <Stat label="Total leads" value={leads.total} to="/admin/leads" tone />
        <Stat label="New" value={leads.new} to="/admin/leads" />
        <Stat label="Contacted" value={leads.contacted} to="/admin/leads" />
      </section>

      <section aria-labelledby="recent-leads" className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="recent-leads" className="text-lg font-extrabold text-ink">
            Recent leads
          </h2>
          <Link to="/admin/leads" className="inline-flex items-center text-sm font-bold text-brand hover:underline max-lg:min-h-11">
            Open inbox →
          </Link>
        </div>
        <Card className="overflow-hidden">
          {recentLeads.length === 0 ? (
            <EmptyState title="No leads yet" text="Inquiries sent from the Contact Us form will appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-soft text-xs uppercase tracking-wider text-ink-700">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="hidden px-4 py-3 md:table-cell">Interest</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="hidden px-4 py-3 md:table-cell">Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {recentLeads.map((l) => (
                    <tr key={l.id}>
                      <td className="px-4 py-3 font-semibold text-ink">{l.name}</td>
                      <td className="px-4 py-3 text-ink-700">{l.email}</td>
                      <td className="hidden px-4 py-3 text-ink-700 md:table-cell">{l.interest ?? '—'}</td>
                      <td className="px-4 py-3">
                        <Badge tone={l.status === 'NEW' ? 'warn' : 'success'}>{l.status === 'NEW' ? 'New' : 'Contacted'}</Badge>
                      </td>
                      <td className="hidden px-4 py-3 text-ink-500 md:table-cell">{fmtDate(l.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>

      <section aria-labelledby="content-stats" className="mt-8">
        <h2 id="content-stats" className="mb-3 text-lg font-extrabold text-ink">
          Content
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(contentLabels).map(([k, m]) => (
            <Stat key={k} label={m.label} value={content[k] ?? 0} to={m.to} />
          ))}
        </div>
      </section>
    </>
  );
}
