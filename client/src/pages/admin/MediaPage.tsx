import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Btn, Card, EmptyState, ErrorState, PageHeader, Spinner } from '@/components/admin/ui';
import { useAdminMutation } from '@/hooks/useAdminMutation';
import { useConfirm } from '@/hooks/useConfirm';
import { useToast } from '@/hooks/useToast';
import { errMsg, fmtSize, uploadMedia, type MediaItem } from '@/lib/admin-api';
import { api, mediaUrl } from '@/lib/api';

export default function MediaPage() {
  const q = useQuery({ queryKey: ['admin', 'media'], queryFn: () => api<MediaItem[]>('/admin/media') });
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const confirm = useConfirm();
  const toast = useToast();

  const upload = useAdminMutation(async (files: File[]) => {
    setBusy(true);
    try {
      for (const f of files) await uploadMedia(f);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }, 'Upload complete');
  const del = useAdminMutation((id: string) => api(`/admin/media/${id}`, { method: 'DELETE' }), 'File deleted');

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('URL copied');
    } catch {
      toast.error('Could not copy — select the URL manually');
    }
  };

  return (
    <>
      <PageHeader
        title="Media library"
        description="Uploaded images (JPG, PNG, WebP, SVG, GIF up to 5MB). Copy a URL to use it in any field, or upload directly from the field."
        actions={
          <>
            <input
              ref={input}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif"
              className="sr-only"
              aria-label="Upload images"
              onChange={(e) => e.target.files?.length && upload.mutate(Array.from(e.target.files))}
            />
            <Btn disabled={busy} onClick={() => input.current?.click()}>
              {busy ? 'Uploading…' : '+ Upload images'}
            </Btn>
          </>
        }
      />
      {q.isLoading ? (
        <Spinner />
      ) : q.isError ? (
        <ErrorState message={errMsg(q.error)} onRetry={() => void q.refetch()} />
      ) : !q.data?.length ? (
        <Card>
          <EmptyState title="No media yet" text="Upload images to build your library." />
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {q.data.map((m) => (
            <li key={m.id}>
              <Card className="overflow-hidden">
                <div className="flex aspect-[4/3] items-center justify-center bg-surface-soft">
                  <img src={mediaUrl(m.url)} alt={m.filename} loading="lazy" className="size-full object-contain" />
                </div>
                <div className="space-y-2 p-3">
                  <p className="truncate text-sm font-bold text-ink" title={m.filename}>
                    {m.filename}
                  </p>
                  <p className="text-xs text-ink-500">{fmtSize(m.size)}</p>
                  <div className="flex gap-2">
                    <Btn size="sm" variant="secondary" onClick={() => void copy(m.url)}>
                      Copy URL
                    </Btn>
                    <Btn
                      size="sm"
                      variant="ghost"
                      className="!text-danger hover:!bg-danger-soft"
                      onClick={async () => {
                        if (
                          await confirm({
                            title: 'Delete file?',
                            message: `${m.filename} will be removed. Pages still using it will show a broken image.`,
                          })
                        )
                          del.mutate(m.id);
                      }}
                    >
                      Delete
                    </Btn>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
