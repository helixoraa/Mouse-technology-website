export interface ContactTopicsContent {
  items: { number: string; title: string; text: string }[];
}

/** Three numbered topic cards under the hero. */
export function ContactTopics({ content }: { content?: ContactTopicsContent }) {
  if (!content) return null;
  return (
    <section className="bg-surface-soft px-5 py-16 md:px-10 xl:px-gutter xl:py-[110px]" aria-label="What to contact us about">
      <ul className="mx-auto grid max-w-page gap-5 md:grid-cols-3">
        {content.items.map((it) => (
          <li key={it.number} className="flex flex-col gap-5 rounded-xl2 border border-line bg-white p-8 shadow-card">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-logo text-sm font-bold text-white">{it.number}</span>
            <h2 className="text-[28px] font-bold leading-tight text-ink">{it.title}</h2>
            <p className="text-body-sm text-ink-500">{it.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default ContactTopics;
