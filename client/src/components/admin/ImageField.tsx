import { useRef, useState } from 'react';
import { mediaUrl } from '@/lib/api';
import { errMsg, uploadMedia } from '@/lib/admin-api';
import { useToast } from '@/hooks/useToast';
import { Btn, inputCls } from './ui';

/** Image URL field: preview, upload (POST /admin/media), manual URL, clear. */
export function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const onFile = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const m = await uploadMedia(file);
      onChange(m.url);
      toast.success('Image uploaded');
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div role="group" aria-label={label} className="rounded-xl border border-line bg-surface-soft p-3">
      <div className="flex items-start gap-4">
        <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-white">
          {value ? (
            <img src={mediaUrl(value)} alt={`${label} preview`} className="size-full object-cover" />
          ) : (
            <span className="px-2 text-center text-xs text-ink-500">No image</span>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="/uploads/… or https://…"
            aria-label={`${label} URL`}
            className={inputCls}
          />
          <div className="flex flex-wrap gap-2">
            <input
              ref={input}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif"
              className="sr-only"
              aria-label={`Upload ${label}`}
              onChange={(e) => void onFile(e.target.files?.[0])}
            />
            <Btn size="sm" variant="secondary" disabled={busy} onClick={() => input.current?.click()}>
              {busy ? 'Uploading…' : 'Upload image'}
            </Btn>
            {value && (
              <Btn size="sm" variant="ghost" onClick={() => onChange('')}>
                Remove
              </Btn>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
