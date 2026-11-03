import { Link } from 'react-router-dom';
import { Segments } from '@/components/ui/Heading';
import checkSm from '@/assets/svg/home-check-sm.svg';
import arrowBlue from '@/assets/svg/home-arrow-blue.svg';
import busEllipseA from '@/assets/svg/home-bus-ellipse-a.svg';
import busEllipseB from '@/assets/svg/home-bus-ellipse-b.svg';
import rippleA from '@/assets/svg/home-ripple-a.svg';
import rippleB from '@/assets/svg/home-ripple-b.svg';
import rippleC from '@/assets/svg/home-ripple-c.svg';
import checkLg from '@/assets/svg/home-check-lg.svg';
import contactlessMd from '@/assets/svg/home-contactless-md.svg';
import contactlessSm from '@/assets/svg/home-contactless-sm.svg';
import cardEllipse from '@/assets/svg/home-card-ellipse.svg';
import moneyEllipseA from '@/assets/svg/home-money-ellipse-a.svg';
import moneyEllipseB from '@/assets/svg/home-money-ellipse-b.svg';
import moneyOrb from '@/assets/svg/home-money-orb.svg';
import moneyOrbHighlight from '@/assets/svg/home-money-orb-highlight.svg';
import statusOn from '@/assets/svg/home-status-dot-on.svg';
import statusOff from '@/assets/svg/home-status-dot-off.svg';
import { ScaledStage } from './ScaledStage';
import type { BusVisualContent, MoneyVisualContent, ProductItem, ProductsContent } from './types';

const BAR_HEIGHTS = [34, 52, 40, 66, 48, 72, 56];

/** "Visual / Bus fare" mockup (620x585): operator view, reader, rotated transit card. */
function BusVisual({ v }: { v: BusVisualContent }) {
  return (
    <ScaledStage width={620} height={511}>
      <div className="absolute left-[200px] top-[120px] size-[420px]">
        <div className="absolute inset-[-26.19%]">
          <img src={busEllipseA} alt="" className="size-full max-w-none" />
        </div>
      </div>
      <div className="absolute left-[-60px] top-[-80px] size-[300px]">
        <div className="absolute inset-[-33.33%]">
          <img src={busEllipseB} alt="" className="size-full max-w-none" />
        </div>
      </div>
      <img src={rippleA} alt="" className="absolute left-[250px] top-[110px] size-[360px] max-w-none" />
      <img src={rippleB} alt="" className="absolute left-[300px] top-[160px] size-[260px] max-w-none" />
      <img src={rippleC} alt="" className="absolute left-[345px] top-[205px] size-[170px] max-w-none" />

      <div className="absolute left-[360px] top-[130px] flex h-[300px] w-[200px] flex-col items-center justify-center gap-3.5 rounded-[30px] border-[1.5px] border-white/25 bg-mock-reader p-[18px] drop-shadow-[0px_24px_25px_rgba(0,0,0,0.5)]">
        <div className="h-1.5 w-[60px] rounded-[3px] bg-white/20" />
        <div className="flex h-[150px] w-[160px] flex-col items-center justify-center gap-2.5 rounded-[20px] border border-mock-cyanBorder bg-mock-cyanBg p-5">
          <div className="flex items-start rounded-pill bg-mock-check p-3">
            <img src={checkLg} alt="" className="size-[26px]" />
          </div>
          <p className="text-base font-bold text-text-onDark">{v.readerStatus}</p>
        </div>
        <img src={contactlessMd} alt="" className="size-[30px]" />
        <p className="text-[11px] text-mock-muted">{v.readerHint}</p>
      </div>

      <div className="absolute left-[8.39px] top-[340px] flex h-[234.629px] w-[313.293px] items-center justify-center">
        <div className="rotate-[14deg]">
          <div className="relative h-[172px] w-[280px] overflow-hidden rounded-3xl border-[1.2px] border-white/35 bg-mock-card shadow-[0px_20px_40px_0px_rgba(0,0,0,0.5)]">
            <img src={cardEllipse} alt="" className="absolute left-[128.8px] top-[-101.2px] size-[220px] max-w-none" />
            <img src={contactlessSm} alt="" className="absolute left-[20.8px] top-[18.8px] size-7" />
            <p className="absolute left-[60.8px] top-[26.8px] text-[10px] font-semibold tracking-[0.18em] text-mock-cardText">
              {v.cardLabel}
            </p>
            <div className="absolute left-[20.8px] top-[78.8px] h-7 w-[38px] rounded-md bg-mock-chip" />
            <p className="absolute left-[20.8px] top-[122.8px] text-[19px] font-extrabold tracking-[0.1em] text-text-onDark">
              {v.cardBrand}
            </p>
          </div>
        </div>
      </div>

      <div className="absolute left-10 top-[60px] flex h-[165px] w-[230px] flex-col items-start gap-3.5 rounded-[22px] border border-white/[0.22] bg-white/[0.08] p-5 backdrop-blur-[12px]">
        <p className="text-sm font-bold text-text-onDark">{v.operatorTitle}</p>
        <p className="text-[11.5px] text-text-muted">{v.operatorText}</p>
        <div className="flex items-end gap-2">
          {BAR_HEIGHTS.map((h, i) => (
            <div key={i} className={`w-[18px] rounded-[5px] ${i === 5 ? 'bg-mock-bar' : 'bg-white/20'}`} style={{ height: h }} />
          ))}
        </div>
      </div>
    </ScaledStage>
  );
}

/** "Visual / Money transfer" mockup (620x585): review panel + status tracker. */
function MoneyVisual({ v }: { v: MoneyVisualContent }) {
  return (
    <ScaledStage width={620} height={585}>
      <div className="absolute left-[-60px] top-[100px] size-[420px]">
        <div className="absolute inset-[-26.19%]">
          <img src={moneyEllipseA} alt="" className="size-full max-w-none" />
        </div>
      </div>
      <div className="absolute left-[300px] top-[-100px] size-[340px]">
        <div className="absolute inset-[-29.41%]">
          <img src={moneyEllipseB} alt="" className="size-full max-w-none" />
        </div>
      </div>
      <img src={moneyOrb} alt="" className="absolute left-[470px] top-[420px] size-[120px] max-w-none" />
      <div className="absolute left-[494px] top-[438px] h-5 w-11">
        <div className="absolute inset-[-30%_-13.64%]">
          <img src={moneyOrbHighlight} alt="" className="size-full max-w-none" />
        </div>
      </div>

      <div className="absolute left-[110px] top-5 flex h-[470px] w-[400px] flex-col items-start gap-4 rounded-[30px] border border-white/[0.22] bg-mock-panel p-7 drop-shadow-[0px_30px_30px_rgba(0,0,0,0.5)]">
        <div className="flex w-full items-center justify-between">
          <p className="text-lg font-bold text-text-onDark">{v.panelTitle}</p>
          <span className="flex items-start rounded-pill bg-mock-mintChip px-2.5 py-[5px] text-[11px] font-semibold text-mock-mint">
            {v.panelStatus}
          </span>
        </div>
        {v.rows.map((r) => (
          <div key={r.label} className="flex w-full items-center justify-between rounded-[14px] bg-white/5 px-4 py-3.5 text-[13px]">
            <p className="text-text-muted">{r.label}</p>
            <p className="font-semibold text-text-onDark">{r.value}</p>
          </div>
        ))}
        <div className="flex w-full items-center justify-center rounded-2xl bg-mock-confirm py-4">
          <p className="text-[15px] font-bold text-white">{v.confirm}</p>
        </div>
      </div>

      <div className="absolute left-[349px] top-[226px] flex h-[126px] w-[250px] flex-col items-start gap-2.5 rounded-[22px] border border-white/25 bg-white/10 p-[18px] drop-shadow-[0px_18px_18px_rgba(0,0,0,0.4)] backdrop-blur-[12px]">
        <p className="text-[13px] font-bold text-text-onDark">{v.trackerTitle}</p>
        {v.trackerSteps.map((s, i) => (
          <div key={s} className="flex items-center gap-2.5">
            <img src={i < 2 ? statusOn : statusOff} alt="" className="size-2.5" />
            <p className={`text-[12.5px] ${i < 2 ? 'font-semibold text-white' : 'text-mock-muted'}`}>{s}</p>
          </div>
        ))}
      </div>
    </ScaledStage>
  );
}

function ProductCard({ item, reverse }: { item: ProductItem; reverse?: boolean }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-[40px] border border-line bg-white shadow-card xl:flex-row">
      <div className="flex flex-1 flex-col items-start justify-center gap-[22px] p-6 sm:p-10 xl:p-[52px]">
        <h3 className="max-w-[560px] text-[30px] font-extrabold leading-9 tracking-[-0.02em] text-ink xl:text-[38px] xl:leading-[44px]">
          {item.title}
        </h3>
        <p className="max-w-[560px] text-base leading-[25px] text-ink-500">{item.text}</p>
        <ol className="flex flex-wrap gap-2" aria-label="How it works">
          {item.journey.map((j, i) => (
            <li key={j} className="flex items-center gap-2 rounded-pill border border-line bg-surface-tint px-3 py-2">
              <span className="flex size-[18px] items-center justify-center rounded-pill bg-mock-blue/90 text-[10px] font-bold text-ink-700">
                {i + 1}
              </span>
              <span className="text-[12.5px] font-medium text-ink-700">{j}</span>
            </li>
          ))}
        </ol>
        <ul className="flex flex-col gap-3">
          {item.features.map((f) => (
            <li key={f} className="flex items-center gap-3">
              <span className="flex items-start rounded-pill bg-brand/10 p-1">
                <img src={checkSm} alt="" className="size-3" />
              </span>
              <span className="text-[15px] font-medium text-ink-700">{f}</span>
            </li>
          ))}
        </ul>
        <p className="max-w-[560px] text-[12.5px] leading-[19px] text-ink-500">{item.note}</p>
        <Link to={item.cta.href} className="flex items-center gap-2 text-[15px] font-bold text-brand hover:text-brand-press">
          {item.cta.label}
          <img src={arrowBlue} alt="" className="size-4" />
        </Link>
      </div>
      <div
        className={`relative self-stretch overflow-hidden xl:w-[620px] xl:shrink-0 ${item.key === 'bus' ? 'bg-mock-bus' : 'bg-mock-money'} ${reverse ? 'xl:order-first' : ''}`}
      >
        {item.key === 'bus' ? <BusVisual v={item.visual} /> : <MoneyVisual v={item.visual} />}
      </div>
    </article>
  );
}

export function ProductsSection({ content }: { content: ProductsContent }) {
  return (
    <section id="products" aria-labelledby="products-heading" className="bg-surface-soft px-5 py-16 md:px-10 xl:px-gutter xl:py-[100px]">
      <div className="mx-auto flex max-w-page flex-col gap-10">
        <div className="flex flex-col gap-[18px]">
          <h2 id="products-heading" className="text-[40px] font-extrabold leading-[1.1] tracking-[-0.03em] text-ink xl:text-h-section">
            <Segments parts={content.title} accentClass="text-brand" />
          </h2>
          <p className="max-w-[680px] text-lg font-medium leading-[27px] text-ink xl:text-xl">{content.intro}</p>
        </div>
        {content.items.map((item) => (
          <ProductCard key={item.key} item={item} reverse={item.key === 'payment'} />
        ))}
      </div>
    </section>
  );
}
