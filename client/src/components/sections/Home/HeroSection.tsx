import { Link } from 'react-router-dom';
import { HeroShell } from '@/components/layout/HeroShell';
import { Segments } from '@/components/ui/Heading';
import ellipseHero from '@/assets/svg/home-ellipse-hero.svg';
import arrowDark from '@/assets/svg/home-arrow-dark.svg';
import orbLarge from '@/assets/svg/home-glass-orb-large.svg';
import orbHighlight from '@/assets/svg/home-orb-highlight.svg';
import orbSmall from '@/assets/svg/home-glass-orb-small.svg';
import orbHighlightSmall from '@/assets/svg/home-orb-highlight-small.svg';
import check from '@/assets/svg/home-check.svg';
import fareDot from '@/assets/svg/home-fare-dot.svg';
import sheenA from '@/assets/svg/home-sheen-a.svg';
import sheenB from '@/assets/svg/home-sheen-b.svg';
import contactless from '@/assets/svg/home-contactless-lg.svg';
import stepDot from '@/assets/svg/home-step-dot.svg';
import stepDotOff from '@/assets/svg/home-step-dot-off.svg';
import liveDot from '@/assets/svg/home-live-dot.svg';
import { ScaledStage } from './ScaledStage';
import type { HeroContent } from './types';

/** Hero visual stage: phone, transit card, transfer card and floating chip (Figma "Hero visual stage"). Canvas is shifted +40px so the chip's negative offset fits. */
function HeroStage({ c }: { c: HeroContent }) {
  const { phone, card, transfer } = c;
  return (
    <ScaledStage width={650} height={660}>
      <div className="absolute left-[420px] top-[10px] size-[210px]">
        <img src={orbLarge} alt="" className="absolute inset-0 size-full max-w-none" />
      </div>
      <div className="absolute left-[465px] top-[42px] h-9 w-20">
        <div className="absolute inset-[-25%_-11.25%]">
          <img src={orbHighlight} alt="" className="size-full max-w-none" />
        </div>
      </div>
      <div className="absolute left-[50px] top-[520px] size-[92px]">
        <img src={orbSmall} alt="" className="absolute inset-0 size-full max-w-none" />
      </div>
      <div className="absolute left-[68px] top-[534px] h-4 w-[30px]">
        <div className="absolute inset-[-31.25%_-16.67%]">
          <img src={orbHighlightSmall} alt="" className="size-full max-w-none" />
        </div>
      </div>

      {/* Phone */}
      <div className="absolute left-[210px] top-[70px] flex h-[520px] w-[262px] flex-col items-start gap-3.5 rounded-[40px] border-[1.5px] border-white/20 bg-mock-phone p-[18px] drop-shadow-[0px_30px_30px_rgba(0,0,0,0.55)]">
        <div className="flex w-full items-center justify-between">
          <p className="text-xs font-semibold text-text-onDark">{phone.time}</p>
          <div className="h-3.5 w-[46px] rounded-[7px] bg-white/[0.12]" />
        </div>
        <p className="text-[13px] font-medium text-mock-muted">{phone.title}</p>
        <div className="flex items-center gap-3">
          <div className="flex items-start rounded-pill bg-mock-check p-[9px]">
            <img src={check} alt="" className="size-5" />
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-lg font-bold text-text-onDark">{phone.resultTitle}</p>
            <p className="text-xs text-mock-muted">{phone.resultText}</p>
          </div>
        </div>
        <div className="flex w-full flex-col gap-1.5 rounded-[22px] bg-mock-balance p-[18px]">
          <p className="text-xs text-mock-pale">{phone.balanceLabel}</p>
          <p className="text-[34px] font-extrabold tracking-[-0.02em] text-text-onDark">{phone.balance}</p>
          <div className="flex gap-1.5">
            <div className="h-[5px] w-[34px] rounded-[3px] bg-white/90" />
            <div className="h-[5px] w-[34px] rounded-[3px] bg-white/40" />
            <div className="h-[5px] w-[34px] rounded-[3px] bg-white/40" />
          </div>
        </div>
        <p className="text-[13px] font-semibold text-mock-label">{phone.recentTitle}</p>
        {phone.rows.map((r, i) => (
          <div key={i} className="flex w-full items-center justify-between rounded-[14px] bg-white/5 px-3.5 py-3">
            <div className="flex items-center gap-2.5">
              <img src={fareDot} alt="" className="size-[22px]" />
              <p className="text-[13px] font-medium text-text-onDark">{r.label}</p>
            </div>
            <p className="text-xs text-mock-cyan">{r.status}</p>
          </div>
        ))}
      </div>

      {/* Transit card */}
      <div className="absolute left-[30px] top-[318.47px] flex h-[258.249px] w-[353.758px] items-center justify-center">
        <div className="-rotate-12">
          <div className="relative h-[196px] w-[320px] overflow-hidden rounded-[26px] border-[1.2px] border-white/35 bg-mock-card shadow-[0px_24px_50px_0px_rgba(0,0,0,0.5)]">
            <img src={sheenA} alt="" className="absolute left-[148.8px] top-[-111.2px] size-[240px] max-w-none" />
            <img src={sheenB} alt="" className="absolute left-[-71.2px] top-[98.8px] size-[180px] max-w-none" />
            <img src={contactless} alt="" className="absolute left-[24.8px] top-[22.8px] size-[34px]" />
            <p className="absolute left-[72.8px] top-[32.8px] text-[11px] font-semibold tracking-[0.18em] text-mock-cardText">
              {card.label}
            </p>
            <div className="absolute left-[24.8px] top-[90.8px] h-8 w-11 rounded-[7px] bg-mock-chip" />
            <p className="absolute left-[24.8px] top-[144.8px] text-[22px] font-extrabold tracking-[0.1em] text-text-onDark">
              {card.brand}
            </p>
            <p className="absolute left-[230.8px] top-[150.8px] text-xs font-medium text-mock-pale">{card.tap}</p>
          </div>
        </div>
      </div>

      {/* Transfer glass card */}
      <div className="absolute left-[360px] top-[470px] flex h-[176px] w-[290px] flex-col items-start gap-3 rounded-3xl border border-white/[0.22] bg-white/[0.08] p-5 drop-shadow-[0px_20px_20px_rgba(0,0,0,0.4)] backdrop-blur-[12px]">
        <div className="flex w-full items-center justify-between">
          <p className="text-[15px] font-bold text-text-onDark">{transfer.title}</p>
          <span className="flex items-start rounded-pill bg-mock-violetChip px-2.5 py-1 text-[10.5px] font-semibold text-mock-violet">
            {transfer.status}
          </span>
        </div>
        {transfer.rows.map((r) => (
          <div key={r.label} className="flex w-full items-start justify-between text-xs">
            <p className="text-text-muted">{r.label}</p>
            <p className="font-medium text-text-onDark">{r.value}</p>
          </div>
        ))}
        <div className="flex w-full items-center justify-between">
          <img src={stepDot} alt="" className="size-3" />
          <div className="h-[3px] w-20 rounded-sm bg-mock-cyan" />
          <img src={stepDot} alt="" className="size-3" />
          <div className="h-[3px] w-20 rounded-sm bg-white/20" />
          <img src={stepDotOff} alt="" className="size-3" />
        </div>
        <div className="flex w-full items-start justify-between text-[10.5px] text-mock-muted">
          {transfer.steps.map((s) => (
            <p key={s}>{s}</p>
          ))}
        </div>
      </div>

      {/* Floating chip */}
      <div className="absolute left-0 top-[90px] flex items-center gap-2.5 rounded-pill border border-white/20 bg-white/[0.08] px-4 py-2.5 backdrop-blur-[12px]">
        <img src={liveDot} alt="" className="size-2" />
        <p className="whitespace-nowrap text-[12.5px] font-semibold text-text-onDark">{c.floatingChip}</p>
      </div>
    </ScaledStage>
  );
}

export function HeroSection({ content }: { content: HeroContent }) {
  return (
    <HeroShell ellipse={ellipseHero} className="xl:h-[860px]">
      <div className="flex flex-col gap-10 pb-4 xl:pb-0">
        <div className="relative z-10 flex flex-col items-start gap-[26px] xl:absolute xl:left-0 xl:top-[186px]">
          <h1 className="max-w-[700px] text-[40px] font-bold leading-[1.15] tracking-[-0.03em] text-white sm:text-[52px] xl:text-[68px] xl:leading-[90px]">
            <Segments parts={content.headline} accentClass="text-brand-sky" />
          </h1>
          <p className="max-w-[594px] text-lg leading-7 text-white xl:text-xl">{content.lead}</p>
          <div className="flex flex-wrap gap-3.5">
            <Link
              to={content.primaryCta.href}
              className="flex items-center gap-2.5 rounded-pill bg-white px-[26px] py-[15px] text-[14.5px] font-semibold text-ink transition-colors hover:bg-surface-tint"
            >
              {content.primaryCta.label}
              <img src={arrowDark} alt="" className="size-[15px]" />
            </Link>
            <Link
              to={content.secondaryCta.href}
              className="flex items-center rounded-pill border border-white/45 px-[26px] py-[15px] text-[14.5px] font-semibold text-text-onDark transition-colors hover:bg-white/10"
            >
              {content.secondaryCta.label}
            </Link>
          </div>
        </div>
        <div className="mx-auto w-full max-w-[650px] xl:absolute xl:left-[643px] xl:top-[70px] xl:mx-0 xl:w-[650px]">
          <HeroStage c={content} />
        </div>
      </div>
    </HeroShell>
  );
}
