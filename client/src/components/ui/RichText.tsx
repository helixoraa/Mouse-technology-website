import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { isExternalUrl } from '@/lib/links';

/**
 * A deliberately tiny, safe subset of Markdown for CMS text blocks (the legal pages): `**bold**`, `[label](/path)` or
 * `[label](https://…)`, plain email addresses (mailto links), and a block whose lines all start with "- " becomes a
 * bulleted list. Everything is rendered as React text, never as HTML, so stored content can't inject markup.
 * A block without any of these renders exactly like a plain paragraph.
 */
const INLINE = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)|([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;
const linkClass = 'font-semibold text-brand underline underline-offset-2 hover:text-brand-press';

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    const [whole, bold, label, href, email] = m;
    if (bold !== undefined)
      out.push(
        <strong key={at} className="font-bold text-ink">
          {inline(bold)}
        </strong>,
      );
    else if (label !== undefined && href !== undefined) {
      if (href.startsWith('/'))
        out.push(
          <Link key={at} to={href} className={linkClass}>
            {label}
          </Link>,
        );
      else if (isExternalUrl(href))
        out.push(
          <a key={at} href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
            {label}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>,
        );
      else out.push(whole);
    } else if (email !== undefined)
      out.push(
        <a key={at} href={`mailto:${email}`} className={linkClass}>
          {email}
        </a>,
      );
    last = at + whole.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const isList = (block: string) => {
  const lines = block.split('\n').filter((l) => l.trim());
  return lines.length > 0 && lines.every((l) => /^\s*-\s+/.test(l));
};

/** Renders text blocks (paragraphs or "- " lists) with the inline subset above. */
export function RichText({ blocks, paragraphClass }: { blocks: string | string[]; paragraphClass?: string }) {
  const list = typeof blocks === 'string' ? [blocks] : blocks;
  return (
    <>
      {list.map((block, i) =>
        isList(block) ? (
          <ul key={i} className="list-disc space-y-1.5 pl-5 marker:text-brand">
            {block
              .split('\n')
              .filter((l) => l.trim())
              .map((l, j) => (
                <li key={j}>{inline(l.replace(/^\s*-\s+/, ''))}</li>
              ))}
          </ul>
        ) : (
          <p key={i} className={paragraphClass}>
            {block.split('\n').map((line, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {inline(line)}
              </Fragment>
            ))}
          </p>
        ),
      )}
    </>
  );
}
