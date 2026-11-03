import { useEffect, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ImageField } from '@/components/admin/ImageField';
import { JsonNode } from '@/components/admin/JsonEditor';
import { Btn, Card, ErrorState, Field, PageHeader, Spinner, TextArea, TextInput } from '@/components/admin/ui';
import { useAdminMutation } from '@/hooks/useAdminMutation';
import { errMsg } from '@/lib/admin-api';
import { api } from '@/lib/api';
import type { SiteSettings } from '@/lib/types';

type Settings = SiteSettings & { id?: number | string };

function Block({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <Card className="p-5 md:p-6">
      <h2 className="text-lg font-extrabold text-ink">{title}</h2>
      {desc && <p className="mb-4 mt-1 text-sm text-ink-700">{desc}</p>}
      <div className={`grid gap-4 ${desc ? '' : 'mt-4'}`}>{children}</div>
    </Card>
  );
}

export default function SettingsPage() {
  const q = useQuery({ queryKey: ['admin', 'settings'], queryFn: () => api<Settings>('/admin/settings') });
  const [s, setS] = useState<Settings | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (q.data && !dirty) setS(q.data);
  }, [q.data, dirty]);

  const save = useAdminMutation(
    (body: Settings) => api<Settings>('/admin/settings', { method: 'PUT', body: JSON.stringify(body) }),
    'Settings saved',
    () => setDirty(false),
  );

  if (q.isLoading) return <Spinner />;
  if (q.isError || !s) return <ErrorState message={errMsg(q.error)} onRetry={() => void q.refetch()} />;

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => {
    setS((cur) => (cur ? { ...cur, [k]: v } : cur));
    setDirty(true);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate(s);
  };

  return (
    <form onSubmit={submit}>
      <PageHeader
        title="Site settings"
        description="Logo, contact details, social links, navigation, footer and SEO defaults."
        actions={
          <Btn type="submit" disabled={!dirty || save.isPending}>
            {save.isPending ? 'Saving…' : 'Save settings'}
          </Btn>
        }
      />
      <div className="grid gap-6">
        <Block title="Brand">
          <Field label="Site name">
            <TextInput value={s.siteName} onChange={(e) => set('siteName', e.target.value)} required />
          </Field>
          <Field label="Tagline">
            <TextInput value={s.tagline ?? ''} onChange={(e) => set('tagline', e.target.value)} />
          </Field>
          <div>
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-700">Logo</span>
            <ImageField label="Logo" value={s.logoUrl ?? ''} onChange={(v) => set('logoUrl', v || null)} />
          </div>
        </Block>

        <Block title="Contact details" desc="Shown on the Contact Us page.">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Email">
              <TextInput type="text" value={s.email ?? ''} onChange={(e) => set('email', e.target.value)} />
            </Field>
            <Field label="Telephone">
              <TextInput value={s.phone ?? ''} onChange={(e) => set('phone', e.target.value)} />
            </Field>
          </div>
          <Field label="Address">
            <TextArea rows={2} value={s.address ?? ''} onChange={(e) => set('address', e.target.value)} />
          </Field>
        </Block>

        <Block title="Social links" desc="Name → URL pairs.">
          <JsonNode
            name="Socials"
            fieldKey="socials"
            value={s.socials ?? {}}
            onChange={(v) => set('socials', v as Settings['socials'])}
            depth={1}
            bare
          />
          <SocialAdder value={s.socials ?? {}} onChange={(v) => set('socials', v)} />
        </Block>

        <Block title="Navigation" desc="Links in the top navigation bar, in order.">
          <JsonNode
            name="Navigation links"
            fieldKey="nav"
            value={s.nav ?? []}
            onChange={(v) => set('nav', v as Settings['nav'])}
            depth={1}
          />
        </Block>

        <Block title="Footer">
          <JsonNode
            name="Footer"
            fieldKey="footer"
            value={s.footer ?? { tagline: '', columns: [], copyright: '' }}
            onChange={(v) => set('footer', v as Settings['footer'])}
            depth={1}
            bare
          />
        </Block>

        <Block title="SEO defaults" desc="Used when a page has no title or description of its own.">
          <JsonNode
            name="SEO"
            fieldKey="seo"
            value={s.seo ?? { default: { title: '', description: '' } }}
            onChange={(v) => set('seo', v as Settings['seo'])}
            depth={1}
            bare
          />
        </Block>
      </div>
      <div className="mt-6 flex justify-end">
        <Btn type="submit" disabled={!dirty || save.isPending}>
          {save.isPending ? 'Saving…' : 'Save settings'}
        </Btn>
      </div>
    </form>
  );
}

function SocialAdder({ value, onChange }: { value: Record<string, string>; onChange: (v: Record<string, string>) => void }) {
  const [name, setName] = useState('');
  return (
    <div className="flex flex-wrap items-end gap-3">
      <Field label="Add network" className="min-w-[200px] flex-1">
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. linkedin" />
      </Field>
      <Btn
        variant="secondary"
        disabled={!name.trim() || name.trim() in value}
        onClick={() => {
          onChange({ ...value, [name.trim()]: '' });
          setName('');
        }}
      >
        + Add
      </Btn>
    </div>
  );
}
