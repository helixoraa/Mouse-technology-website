import { AnimatedMedia } from '@/components/ui/AnimatedMedia';
import { Segments } from '@/components/ui/Heading';
import type { PaymentContent } from './types';

export function PaymentSection({ content }: { content: PaymentContent }) {
  return (
    <section id="payment" aria-labelledby="payment-heading" className="bg-section-dark-rev px-5 py-16 md:px-10 xl:px-gutter xl:py-[100px]">
      <div className="mx-auto flex max-w-page flex-col items-center gap-10 xl:flex-row xl:gap-[72px]">
        <div className="flex w-full flex-col items-start gap-[22px] xl:flex-1">
          <h2
            id="payment-heading"
            className="max-w-[520px] text-[36px] font-bold leading-[1.1] tracking-[-0.025em] text-text-onDark xl:text-[56px] xl:leading-[53px]"
          >
            <Segments parts={content.title} accentClass="text-brand-sky" />
          </h2>
          <p className="max-w-[500px] text-base font-medium leading-[25px] text-white">{content.lead}</p>
          <ol className="flex w-full flex-col gap-[22px]">
            {content.steps.map((s) => (
              <li key={s.no} className="flex w-full items-center gap-5 border-b border-white/[0.14] py-4 font-medium">
                <span className="text-[13px] text-brand-sky">{s.no}</span>
                <span className="text-[17px] text-text-onDark">{s.label}</span>
              </li>
            ))}
          </ol>
        </div>
        <AnimatedMedia
          src={content.animation.src}
          staticSrc={content.animation.staticImage}
          alt={content.animation.alt}
          width={600}
          height={500}
          className="w-full max-w-[576px] xl:w-[576px]"
        />
      </div>
    </section>
  );
}
