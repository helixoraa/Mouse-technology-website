import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, mediaUrl } from '@/lib/api';
import { errMsg } from '@/lib/admin-api';
import { useAdminMutation } from '@/hooks/useAdminMutation';
import { useConfirm } from '@/hooks/useConfirm';
import { useToast } from '@/hooks/useToast';
import { ImageField } from './ImageField';
import { Modal } from './Modal';
import { SortableItem, SortableList } from './Sortable';
import { Btn, Card, EmptyState, ErrorState, Field, PageHeader, Select, Spinner, TextArea, TextInput, Toggle } from './ui';

export type Row = Record<string, unknown> & { id: string };
export type FieldType = 'text' | 'textarea' | 'image' | 'select' | 'checkbox' | 'password' | 'email' | 'date' | 'json' | 'number';

export interface FieldDef {
  name: string;
  label: string;
  type?: FieldType;
  options?: { value: string; label: string }[];
  required?: boolean;
  hint?: string;
  full?: boolean;
  /** Only shown/required when creating (e.g. password). */
  createOnly?: boolean;
  rows?: number;
}
export interface ColumnDef {
  key: string;
  label: string;
  render?: (row: Row) => ReactNode;
  className?: string;
}
export interface ResourceConfig {
  path: string; // e.g. 'services'
  title: string;
  singular: string;
  description: string;
  columns: ColumnDef[];
  fields: FieldDef[];
  defaults: Record<string, unknown>;
  reorder?: boolean;
  hasVisible?: boolean;
  canDelete?: (row: Row, me?: string) => boolean;
}

const toInput = (f: FieldDef, v: unknown): unknown => {
  if (f.type === 'json') return v == null ? '' : JSON.stringify(v, null, 2);
  if (f.type === 'date') return v ? String(v).slice(0, 10) : '';
  if (f.type === 'checkbox') return !!v;
  return v ?? '';
};

function RowForm({
  cfg,
  row,
  onClose,
  onSave,
  busy,
}: {
  cfg: ResourceConfig;
  row: Row | null;
  onClose: () => void;
  onSave: (body: Record<string, unknown>) => void;
  busy: boolean;
}) {
  const toast = useToast();
  const fields = cfg.fields.filter((f) => !f.createOnly || !row);
  const [form, setForm] = useState<Record<string, unknown>>(() =>
    Object.fromEntries(fields.map((f) => [f.name, toInput(f, row ? row[f.name] : cfg.defaults[f.name])])),
  );
  const set = (k: string, v: unknown) => setForm((s) => ({ ...s, [k]: v }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const body: Record<string, unknown> = {};
    for (const f of fields) {
      const v = form[f.name];
      if (f.type === 'json') {
        try {
          body[f.name] = String(v).trim() ? JSON.parse(String(v)) : null;
        } catch {
          toast.error(`${f.label} is not valid JSON`);
          return;
        }
      } else if (f.type === 'date') {
        if (v) body[f.name] = new Date(String(v)).toISOString();
      } else if (f.type === 'number') body[f.name] = Number(v);
      else if (f.type === 'image') body[f.name] = v ? String(v) : null;
      else if (f.type === 'password') {
        if (v) body[f.name] = v;
      } else body[f.name] = v;
    }
    onSave(body);
  };

  return (
    <Modal title={row ? `Edit ${cfg.singular}` : `New ${cfg.singular}`} onClose={onClose} size="md">
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        {fields.map((f) => {
          const v = form[f.name];
          const span = f.full || f.type === 'textarea' || f.type === 'image' || f.type === 'json' ? 'md:col-span-2' : '';
          if (f.type === 'checkbox')
            return (
              <div key={f.name} className={`flex items-center justify-between rounded-xl border border-line px-3 py-2 ${span}`}>
                <span className="text-sm font-semibold text-ink">{f.label}</span>
                <Toggle checked={!!v} onChange={(x) => set(f.name, x)} label={f.label} />
              </div>
            );
          if (f.type === 'image')
            return (
              <div key={f.name} className={span}>
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-700">{f.label}</span>
                <ImageField label={f.label} value={String(v ?? '')} onChange={(x) => set(f.name, x)} />
              </div>
            );
          return (
            <Field key={f.name} label={f.label + (f.required ? ' *' : '')} hint={f.hint} className={span}>
              {f.type === 'textarea' || f.type === 'json' ? (
                <TextArea
                  rows={f.rows ?? (f.type === 'json' ? 6 : 4)}
                  value={String(v ?? '')}
                  required={f.required}
                  onChange={(e) => set(f.name, e.target.value)}
                  className={f.type === 'json' ? 'font-mono text-xs' : ''}
                />
              ) : f.type === 'select' ? (
                <Select value={String(v ?? '')} onChange={(e) => set(f.name, e.target.value)} required={f.required}>
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              ) : (
                <TextInput
                  type={
                    f.type === 'password'
                      ? 'password'
                      : f.type === 'email'
                        ? 'email'
                        : f.type === 'date'
                          ? 'date'
                          : f.type === 'number'
                            ? 'number'
                            : 'text'
                  }
                  autoComplete={f.type === 'password' ? 'new-password' : undefined}
                  value={String(v ?? '')}
                  required={f.required || (f.type === 'password' && !row)}
                  minLength={f.type === 'password' ? 8 : undefined}
                  onChange={(e) => set(f.name, e.target.value)}
                />
              )}
            </Field>
          );
        })}
        <div className="flex justify-end gap-3 border-t border-line pt-4 md:col-span-2">
          <Btn variant="secondary" onClick={onClose}>
            Cancel
          </Btn>
          <Btn type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

export function ResourcePage({ cfg, currentUserId }: { cfg: ResourceConfig; currentUserId?: string }) {
  const confirm = useConfirm();
  const q = useQuery({ queryKey: ['admin', cfg.path], queryFn: () => api<Row[]>(`/admin/${cfg.path}`) });
  const [rows, setRows] = useState<Row[]>([]);
  const [editing, setEditing] = useState<Row | 'new' | null>(null);

  useEffect(() => {
    if (q.data) setRows(cfg.reorder ? [...q.data].sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0)) : q.data);
  }, [q.data, cfg.reorder]);

  const close = () => setEditing(null);
  const save = useAdminMutation(
    ({ id, body }: { id?: string; body: Record<string, unknown> }) =>
      api(id ? `/admin/${cfg.path}/${id}` : `/admin/${cfg.path}`, { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) }),
    `${cfg.singular} saved`,
    close,
  );
  const patchVisible = useAdminMutation(
    ({ id, visible }: { id: string; visible: boolean }) =>
      api(`/admin/${cfg.path}/${id}`, { method: 'PUT', body: JSON.stringify({ visible }) }),
    undefined,
  );
  const del = useAdminMutation((id: string) => api(`/admin/${cfg.path}/${id}`, { method: 'DELETE' }), `${cfg.singular} deleted`);
  const reorder = useAdminMutation(
    (ids: string[]) => api(`/admin/${cfg.path}/reorder`, { method: 'PUT', body: JSON.stringify({ ids }) }),
    'Order updated',
  );

  const onReorder = (ids: string[]) => {
    setRows((cur) => ids.map((id) => cur.find((r) => r.id === id)!).filter(Boolean));
    reorder.mutate(ids);
  };
  const remove = async (r: Row) => {
    const label = String(r.title ?? r.name ?? r.question ?? r.email ?? 'this item');
    if (await confirm({ title: `Delete ${cfg.singular}?`, message: `“${label}” will be permanently deleted.` })) del.mutate(r.id);
  };

  const body = (r: Row, handle?: ReactNode) => (
    <>
      {cfg.reorder && <td className="w-10 px-2 py-3">{handle}</td>}
      {cfg.columns.map((c) => (
        <td key={c.key} className={`px-4 py-3 align-middle ${c.className ?? ''}`}>
          {c.render ? c.render(r) : String(r[c.key] ?? '—')}
        </td>
      ))}
      {cfg.hasVisible && (
        <td className="px-4 py-3">
          <Toggle
            checked={!!r.visible}
            label={`Show ${String(r.title ?? r.name ?? r.question ?? 'item')} on the website`}
            onChange={(v) => {
              setRows((cur) => cur.map((x) => (x.id === r.id ? { ...x, visible: v } : x)));
              patchVisible.mutate({ id: r.id, visible: v });
            }}
          />
        </td>
      )}
      <td className="whitespace-nowrap px-4 py-3 text-right">
        <Btn size="sm" variant="ghost" onClick={() => setEditing(r)}>
          Edit
        </Btn>
        {(cfg.canDelete?.(r, currentUserId) ?? true) && (
          <Btn size="sm" variant="ghost" className="!text-danger hover:!bg-danger-soft" onClick={() => void remove(r)}>
            Delete
          </Btn>
        )}
      </td>
    </>
  );

  const head = (
    <thead className="bg-surface-soft text-xs uppercase tracking-wider text-ink-700">
      <tr>
        {cfg.reorder && (
          <th className="w-10 px-2 py-3">
            <span className="sr-only">Reorder</span>
          </th>
        )}
        {cfg.columns.map((c) => (
          <th key={c.key} className={`px-4 py-3 ${c.className ?? ''}`}>
            {c.label}
          </th>
        ))}
        {cfg.hasVisible && <th className="px-4 py-3">Visible</th>}
        <th className="px-4 py-3 text-right">Actions</th>
      </tr>
    </thead>
  );

  return (
    <>
      <PageHeader
        title={cfg.title}
        description={cfg.description}
        actions={<Btn onClick={() => setEditing('new')}>+ New {cfg.singular.toLowerCase()}</Btn>}
      />
      <Card className="overflow-hidden">
        {q.isLoading ? (
          <Spinner />
        ) : q.isError ? (
          <ErrorState message={errMsg(q.error)} onRetry={() => void q.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState
            title={`No ${cfg.title.toLowerCase()} yet`}
            action={<Btn onClick={() => setEditing('new')}>Create the first one</Btn>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">{cfg.title}</caption>
              {head}
              {cfg.reorder ? (
                <SortableList ids={rows.map((r) => r.id)} onReorder={onReorder}>
                  <tbody className="divide-y divide-line bg-white">
                    {rows.map((r) => (
                      <SortableItem key={r.id} id={r.id} as="tr">
                        {(handle) => body(r, handle)}
                      </SortableItem>
                    ))}
                  </tbody>
                </SortableList>
              ) : (
                <tbody className="divide-y divide-line">
                  {rows.map((r) => (
                    <tr key={r.id}>{body(r)}</tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>
        )}
      </Card>
      {editing && (
        <RowForm
          cfg={cfg}
          row={editing === 'new' ? null : editing}
          onClose={close}
          busy={save.isPending}
          onSave={(b) => save.mutate({ id: editing === 'new' ? undefined : editing.id, body: b })}
        />
      )}
    </>
  );
}

export function Thumb({ src, alt }: { src?: unknown; alt: string }) {
  return src ? (
    <img src={mediaUrl(String(src))} alt={alt} className="size-12 rounded-lg border border-line object-cover" />
  ) : (
    <span className="flex size-12 items-center justify-center rounded-lg border border-dashed border-line text-[10px] text-ink-500">
      none
    </span>
  );
}
