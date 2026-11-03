import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { JsonEditor } from '@/components/admin/JsonEditor';
import { Modal } from '@/components/admin/Modal';
import { SortableItem, SortableList } from '@/components/admin/Sortable';
import { Badge, Btn, Card, EmptyState, ErrorState, Field, PageHeader, Spinner, TextInput, Toggle } from '@/components/admin/ui';
import { useAdminMutation } from '@/hooks/useAdminMutation';
import { useConfirm } from '@/hooks/useConfirm';
import { errMsg, PAGES, type AdminSection } from '@/lib/admin-api';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';

function SectionCard({
  section,
  handle,
  onSaveContent,
  onToggle,
  onDelete,
}: {
  section: AdminSection;
  handle: React.ReactNode;
  onSaveContent: (content: unknown) => void;
  onToggle: (v: boolean) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<unknown>(section.content);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!dirty) setDraft(section.content);
  }, [section.content, dirty]);

  return (
    <Card className={cn('overflow-hidden', !section.visible && 'opacity-75')}>
      <div className="flex flex-wrap items-center gap-3 px-3 py-3">
        {handle}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="min-w-0 flex-1 rounded-lg px-2 py-1 text-left hover:bg-surface-soft"
        >
          <span className="block truncate text-sm font-extrabold text-ink">{section.key}</span>
          <span className="text-xs text-ink-500">{open ? 'Click to collapse' : 'Click to edit content'}</span>
        </button>
        {dirty && <Badge tone="warn">Unsaved</Badge>}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-ink-700">{section.visible ? 'Visible' : 'Hidden'}</span>
          <Toggle checked={section.visible} onChange={onToggle} label={`Show section ${section.key} on the website`} />
        </div>
        <Btn size="sm" variant="ghost" onClick={onDelete} aria-label={`Delete section ${section.key}`}>
          Delete
        </Btn>
      </div>
      {open && (
        <div className="space-y-5 border-t border-line bg-white p-4 md:p-5">
          <JsonEditor
            value={draft}
            onChange={(v) => {
              setDraft(v);
              setDirty(true);
            }}
          />
          <div className="flex justify-end gap-3 border-t border-line pt-4">
            <Btn
              variant="secondary"
              disabled={!dirty}
              onClick={() => {
                setDraft(section.content);
                setDirty(false);
              }}
            >
              Discard changes
            </Btn>
            <Btn
              disabled={!dirty}
              onClick={() => {
                onSaveContent(draft);
                setDirty(false);
              }}
            >
              Save section
            </Btn>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function SectionsPage() {
  const [params, setParams] = useSearchParams();
  const page = PAGES.some((p) => p.key === params.get('page')) ? params.get('page')! : 'home';
  const confirm = useConfirm();
  const activeTab = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    activeTab.current?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [page]);
  const q = useQuery({ queryKey: ['admin', 'sections', page], queryFn: () => api<AdminSection[]>(`/admin/sections?page=${page}`) });
  const [items, setItems] = useState<AdminSection[]>([]);
  const [adding, setAdding] = useState(false);
  const [newKey, setNewKey] = useState('');

  useEffect(() => {
    if (q.data) setItems([...q.data].sort((a, b) => a.order - b.order));
  }, [q.data]);

  const save = useAdminMutation(
    ({ id, ...body }: { id: string; content?: unknown; visible?: boolean }) =>
      api(`/admin/sections/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    'Section saved',
  );
  const reorder = useAdminMutation(
    (ids: string[]) => api('/admin/sections/reorder', { method: 'PUT', body: JSON.stringify({ page, ids }) }),
    'Order updated',
  );
  const del = useAdminMutation((id: string) => api(`/admin/sections/${id}`, { method: 'DELETE' }), 'Section deleted');
  const create = useAdminMutation(
    (key: string) => api('/admin/sections', { method: 'POST', body: JSON.stringify({ page, key, content: {}, visible: true }) }),
    'Section created',
    () => {
      setAdding(false);
      setNewKey('');
    },
  );

  const onReorder = (ids: string[]) => {
    setItems((cur) => ids.map((id) => cur.find((s) => s.id === id)!).filter(Boolean));
    reorder.mutate(ids);
  };
  const toggle = (s: AdminSection, visible: boolean) => {
    setItems((cur) => cur.map((x) => (x.id === s.id ? { ...x, visible } : x)));
    save.mutate({ id: s.id, visible });
  };
  const remove = async (s: AdminSection) => {
    if (
      await confirm({
        title: 'Delete section?',
        message: `Delete “${s.key}” and its content from the ${page} page? This cannot be undone.`,
      })
    )
      del.mutate(s.id);
  };

  const pageMeta = PAGES.find((p) => p.key === page)!;

  return (
    <>
      <PageHeader
        title="Page sections"
        description="Edit text and images, reorder sections by dragging, and show or hide them. Changes appear on the public site immediately."
        actions={
          <>
            <a
              href={pageMeta.path}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center text-sm font-bold text-brand hover:underline max-lg:min-h-11"
            >
              Preview page ↗
            </a>
            <Btn onClick={() => setAdding(true)}>+ Add section</Btn>
          </>
        }
      />

      <div
        role="tablist"
        aria-label="Pages"
        className="-mx-1 mb-6 flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain px-1 py-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:flex-wrap lg:overflow-visible [&::-webkit-scrollbar]:hidden"
      >
        {PAGES.map((p) => (
          <button
            key={p.key}
            role="tab"
            aria-selected={p.key === page}
            ref={p.key === page ? activeTab : undefined}
            onClick={() => setParams({ page: p.key })}
            className={cn(
              'shrink-0 snap-start whitespace-nowrap rounded-pill border px-4 py-2 text-sm font-bold transition-colors max-lg:min-h-11',
              p.key === page ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink-700 hover:border-brand',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {q.isLoading ? (
        <Spinner />
      ) : q.isError ? (
        <ErrorState message={errMsg(q.error)} onRetry={() => void q.refetch()} />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState title="No sections on this page" text="Add a section with the key used by the page component." />
        </Card>
      ) : (
        <SortableList ids={items.map((s) => s.id)} onReorder={onReorder}>
          <div className="space-y-3">
            {items.map((s) => (
              <SortableItem key={s.id} id={s.id}>
                {(handle) => (
                  <SectionCard
                    section={s}
                    handle={handle}
                    onSaveContent={(content) => save.mutate({ id: s.id, content })}
                    onToggle={(v) => toggle(s, v)}
                    onDelete={() => void remove(s)}
                  />
                )}
              </SortableItem>
            ))}
          </div>
        </SortableList>
      )}

      {adding && (
        <Modal title={`Add section to ${pageMeta.label}`} onClose={() => setAdding(false)} size="sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newKey.trim()) create.mutate(newKey.trim());
            }}
            className="space-y-4"
          >
            <Field label="Section key" hint="Must match the key the page component reads, e.g. “hero”.">
              <TextInput value={newKey} onChange={(e) => setNewKey(e.target.value)} required />
            </Field>
            <div className="flex justify-end gap-3">
              <Btn variant="secondary" onClick={() => setAdding(false)}>
                Cancel
              </Btn>
              <Btn type="submit" disabled={create.isPending}>
                Create
              </Btn>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
