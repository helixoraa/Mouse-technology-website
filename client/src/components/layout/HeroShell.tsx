import type { ReactNode } from 'react';
import ellipseHero from '@/assets/svg/ellipse-hero.svg';
import ellipseSmall from '@/assets/svg/ellipse-small.svg';
import { Navbar } from './Navbar';

/** Dark gradient hero wrapper with the glow ellipses and navigation, shared by every page frame. */
export function HeroShell({
  children,
  className = '',
  ellipse = ellipseHero,
  smallEllipse = ellipseSmall,
  ellipseClass = 'left-[52%] top-[21px]',
  smallEllipseClass = 'left-[68%] top-[380px]',
}: {
  children: ReactNode;
  className?: string;
  ellipse?: string;
  /** Optional per-page overrides (Home uses Figma's exact glow assets/positions). */
  smallEllipse?: string;
  ellipseClass?: string;
  smallEllipseClass?: string;
}) {
  return (
    <header className={`relative overflow-hidden bg-hero px-5 pb-16 pt-[30px] md:px-10 xl:px-gutter xl:pb-20 ${className}`}>
      <div aria-hidden className={`pointer-events-none absolute ${ellipseClass} hidden size-[640px] md:block`}>
        <img src={ellipse} alt="" className="absolute -inset-[23.44%] size-[146.88%] max-w-none" />
      </div>
      <div aria-hidden className={`pointer-events-none absolute ${smallEllipseClass} hidden size-[360px] md:block`}>
        <img src={smallEllipse} alt="" className="absolute -inset-[36.11%] size-[172.22%] max-w-none" />
      </div>
      <div className="relative mx-auto flex w-full max-w-page flex-col gap-12 xl:gap-[68px]">
        <Navbar />
        {children}
      </div>
    </header>
  );
}
