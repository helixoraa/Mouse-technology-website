import { Segments } from '@/components/ui/Heading';
import { homeIcons } from './homeIcons';
import type { ProjectsContent } from './types';

export function ProjectsSection({ content }: { content: ProjectsContent }) {
  return (
    <section
      id="portfolio"
      aria-labelledby="portfolio-heading"
      className="bg-section-dark px-5 py-16 md:px-10 xl:min-h-[669px] xl:px-gutter xl:py-[100px]"
    >
      <div className="mx-auto flex max-w-page flex-col items-center gap-12">
        <div className="flex flex-col items-center gap-3.5 text-center text-white">
          <h2
            id="portfolio-heading"
            className="max-w-[900px] text-[36px] font-bold leading-[1.1] tracking-[-0.025em] xl:text-[56px] xl:leading-[56px]"
          >
            <Segments parts={content.title} accentClass="text-brand-sky" />
          </h2>
          <p className="max-w-[670px] text-lg font-medium leading-[25px] xl:text-xl">{content.lead}</p>
        </div>
        <ul className="grid w-full gap-5 md:grid-cols-2">
          {content.items.map((p) => (
            <li
              key={p.title}
              className="flex items-center gap-4 rounded-[26px] max-sm:flex-col max-sm:items-start sm:gap-[22px] border border-white/[0.14] bg-white/[0.06] p-6 sm:p-[30px]"
            >
              <div className="flex shrink-0 items-start rounded-[18px] bg-tile-project p-4">
                <img src={homeIcons[p.icon]} alt="" className="size-7" />
              </div>
              <div className="flex min-w-0 flex-col gap-2 font-medium text-white">
                <h3 className="break-words text-[20px] tracking-[-0.01em] sm:text-[22px] xl:text-2xl">{p.title}</h3>
                <p className="text-base leading-[22px]" style={p.textWidth ? { maxWidth: p.textWidth } : undefined}>
                  {p.text}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
