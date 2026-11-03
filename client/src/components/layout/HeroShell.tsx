import type { ReactNode } from 'react';
import ellipseHero from '@/assets/svg/ellipse-hero.svg';
import ellipseSmall from '@/assets/svg/ellipse-small.svg';
import { Navbar } from './Navbar';

/** Dark gradient hero wrapper with the glow ellipses and navigation, shared by every page frame. */
export function HeroShell({
  children,
  className = '',
  ellipse = ellipseHero,
}: {
  children: ReactNode;
  className?: string;
  ellipse?: string;
}) {
  return (
    <header className={`relative overflow-hidden bg-hero px-5 pb-16 pt-[30px] md:px-10 xl:px-gutter xl:pb-20 ${className}`}>
      <div aria-hidden className="pointer-events-none absolute left-[52%] top-[21px] hidden size-[640px] md:block">
        <img src={ellipse} alt="" className="absolute -inset-[23.44%] size-[146.88%] max-w-none" />
      </div>
      <div aria-hidden className="pointer-events-none absolute left-[68%] top-[380px] hidden size-[360px] md:block">
        <img src={ellipseSmall} alt="" className="absolute -inset-[36.11%] size-[172.22%] max-w-none" />
      </div>
      <div className="relative mx-auto flex w-full max-w-page flex-col gap-12 xl:gap-[68px]">
        <Navbar />
        {children}
      </div>
    </header>
  );
}
