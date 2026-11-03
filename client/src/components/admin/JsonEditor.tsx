import { Segments } from '@/components/ui/Heading';
import type { Segment } from '@/lib/types';
import { ImageField } from './ImageField';
import { Btn, Field, TextArea, TextInput, Toggle } from './ui';

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);

const humanize = (k: string) =>
  k
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^./, (c) => c.toUpperCase());

export function isImageLike(key: string, value: unknown): boolean {
  if (typeof value === 'string' && value.startsWith('/uploads/')) return true;
  return /^(image|src|photo|avatar|logo)$/i.test(key) || /(Image|Url)$/.test(key);
}

function isSegments(key: string, arr: unknown[]): boolean {
  if (arr.length === 0) return key === 'segments';
  return arr.every((i) => isObj(i) && typeof i.text === 'string' && Object.keys(i).every((k) => k === 'text' || k === 'accent'));
}

/** A blank copy of a value with the same shape (used when adding array items). */
function blank(v: unknown): unknown {
  if (typeof v === 'string') return '';
  if (typeof v === 'number') return 0;
  if (typeof v === 'boolean') return false;
  if (Array.isArray(v)) return [];
  if (isObj(v)) return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, blank(x)]));
  return '';
}

function itemTitle(v: unknown, i: number): string {
  if (isObj(v)) {
    for (const k of ['title', 'label', 'name', 'heading', 'question', 'text', 'key']) {
      if (typeof v[k] === 'string' && v[k]) return String(v[k]).slice(0, 60);
    }
  }
  if (typeof v === 'string' && v) return v.slice(0, 60);
  return `Item ${i + 1}`;
}

function move<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const c = arr.slice();
  const [x] = c.splice(from, 1);
  c.splice(to, 0, x);
  return c;
}

function SegmentsEditor({ label, value, onChange }: { label: string; value: Segment[]; onChange: (v: Segment[]) => void }) {
  return (
    <fieldset className="rounded-xl border border-line p-3">
      <legend className="px-1 text-xs font-bold uppercase tracking-wider text-ink-700">{label} (heading words)</legend>
      <p className="mb-2 rounded-lg bg-navy-950 px-3 py-2 text-sm font-bold text-white" aria-label="Preview">
        <Segments parts={value} accentClass="text-brand-sky" />
        {value.length === 0 && <span className="text-text-muted">Preview</span>}
      </p>
      <div className="space-y-2">
        {value.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <TextInput
              aria-label={`${label} segment ${i + 1} text`}
              value={s.text}
              onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))}
            />
            <label className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-ink-700">
              <input
                type="checkbox"
                checked={!!s.accent}
                onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, accent: e.target.checked } : x)))}
              />
              Accent
            </label>
            <Btn size="sm" variant="ghost" aria-label="Move segment up" onClick={() => onChange(move(value, i, i - 1))} disabled={i === 0}>
              ↑
            </Btn>
            <Btn
              size="sm"
              variant="ghost"
              aria-label="Move segment down"
              onClick={() => onChange(move(value, i, i + 1))}
              disabled={i === value.length - 1}
            >
              ↓
            </Btn>
            <Btn size="sm" variant="ghost" aria-label="Remove segment" onClick={() => onChange(value.filter((_, j) => j !== i))}>
              ✕
            </Btn>
          </div>
        ))}
      </div>
      <Btn size="sm" variant="secondary" className="mt-3" onClick={() => onChange([...value, { text: '', accent: false }])}>
        + Add segment
      </Btn>
    </fieldset>
  );
}

function ArrayEditor({
  label,
  value,
  onChange,
  depth,
}: {
  label: string;
  value: unknown[];
  onChange: (v: unknown[]) => void;
  depth: number;
}) {
  const allPrimitive = value.length > 0 && value.every((v) => typeof v === 'string');
  const template = value.length ? blank(value[value.length - 1]) : '';
  return (
    <fieldset className="rounded-xl border border-line p-3">
      <legend className="px-1 text-xs font-bold uppercase tracking-wider text-ink-700">
        {label} ({value.length})
      </legend>
      <div className="space-y-3">
        {value.length === 0 && <p className="text-sm text-ink-500">No items yet.</p>}
        {value.map((item, i) => (
          <div key={i} className="rounded-xl border border-line-dash bg-surface-soft/60 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="truncate text-sm font-bold text-ink">
                {i + 1}. {allPrimitive ? 'Text' : itemTitle(item, i)}
              </span>
              <div className="flex shrink-0 gap-1">
                <Btn
                  size="sm"
                  variant="ghost"
                  aria-label={`Move item ${i + 1} up`}
                  disabled={i === 0}
                  onClick={() => onChange(move(value, i, i - 1))}
                >
                  ↑
                </Btn>
                <Btn
                  size="sm"
                  variant="ghost"
                  aria-label={`Move item ${i + 1} down`}
                  disabled={i === value.length - 1}
                  onClick={() => onChange(move(value, i, i + 1))}
                >
                  ↓
                </Btn>
                <Btn
                  size="sm"
                  variant="ghost"
                  aria-label={`Remove item ${i + 1}`}
                  onClick={() => onChange(value.filter((_, j) => j !== i))}
                >
                  ✕
                </Btn>
              </div>
            </div>
            <JsonNode
              name={`${label} ${i + 1}`}
              fieldKey=""
              value={item}
              onChange={(v) => onChange(value.map((x, j) => (j === i ? v : x)))}
              depth={depth + 1}
              bare
            />
          </div>
        ))}
      </div>
      <Btn size="sm" variant="secondary" className="mt-3" onClick={() => onChange([...value, template])}>
        + Add item
      </Btn>
    </fieldset>
  );
}

interface NodeProps {
  name: string;
  fieldKey: string;
  value: unknown;
  onChange: (v: unknown) => void;
  depth?: number;
  bare?: boolean;
}

export function JsonNode({ name, fieldKey, value, onChange, depth = 0, bare }: NodeProps) {
  if (Array.isArray(value)) {
    if (isSegments(fieldKey, value)) return <SegmentsEditor label={name} value={value as Segment[]} onChange={onChange} />;
    return <ArrayEditor label={name} value={value} onChange={onChange} depth={depth} />;
  }
  if (isObj(value)) {
    const body = (
      <div className="grid gap-4">
        {Object.entries(value).map(([k, v]) => (
          <JsonNode
            key={k}
            name={humanize(k)}
            fieldKey={k}
            value={v}
            onChange={(nv) => onChange({ ...value, [k]: nv })}
            depth={depth + 1}
          />
        ))}
        {Object.keys(value).length === 0 && <p className="text-sm text-ink-500">Empty.</p>}
      </div>
    );
    if (bare || depth === 0) return body;
    return (
      <fieldset className="rounded-xl border border-line p-3">
        <legend className="px-1 text-xs font-bold uppercase tracking-wider text-ink-700">{name}</legend>
        {body}
      </fieldset>
    );
  }
  if (typeof value === 'boolean') {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2">
        <span className="text-sm font-semibold text-ink">{name}</span>
        <Toggle checked={value} onChange={onChange} label={name} />
      </div>
    );
  }
  if (typeof value === 'number') {
    return (
      <Field label={name}>
        <TextInput type="number" value={Number.isFinite(value) ? value : 0} onChange={(e) => onChange(Number(e.target.value))} />
      </Field>
    );
  }
  const str = value == null ? '' : String(value);
  if (isImageLike(fieldKey, str)) return <ImageField label={name} value={str} onChange={onChange} />;
  if (str.length > 70 || str.includes('\n')) {
    return (
      <Field label={name}>
        <TextArea rows={Math.min(10, Math.max(3, Math.ceil(str.length / 70)))} value={str} onChange={(e) => onChange(e.target.value)} />
      </Field>
    );
  }
  return (
    <Field label={name}>
      <TextInput value={str} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

/** Generic recursive editor for arbitrary section JSON. */
export function JsonEditor({ value, onChange }: { value: unknown; onChange: (v: unknown) => void }) {
  return <JsonNode name="Content" fieldKey="" value={value} onChange={onChange} depth={0} />;
}
