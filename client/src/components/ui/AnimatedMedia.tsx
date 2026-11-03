import { useEffect, useRef, useState } from 'react';
import { mediaUrl } from '@/lib/api';

/** Files bundled with the client (/animations/*) live on the client origin; uploads live on the API origin. */
const resolve = (src: string) => (src.startsWith('/animations/') ? src : mediaUrl(src));

export interface AnimationContent {
  src: string;
  staticImage: string;
  alt: string;
}

interface Props {
  src: string;
  /** Static final frame (WebP). Served under prefers-reduced-motion and while offscreen. */
  staticSrc: string;
  width: number;
  height: number;
  alt: string;
  className?: string;
  /** Corner radius in px (applied with overflow hidden to the wrapper). */
  radius?: number;
}

/**
 * Animated SVG (SMIL) rendered through <img> so it is never inlined.
 * - fixed aspect-ratio box: no layout shift, scales fluidly
 * - prefers-reduced-motion: static WebP (via <picture> and a runtime matchMedia listener)
 * - pauses offscreen by swapping to the static frame (IntersectionObserver)
 */
export function AnimatedMedia({ src, staticSrc, width, height, alt, className = '', radius = 0 }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  useEffect(() => {
    const el = box.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: '120px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const animated = inView && !reduced;
  const still = resolve(staticSrc);
  return (
    <div
      ref={box}
      className={`overflow-hidden ${className}`}
      style={{ aspectRatio: `${width} / ${height}`, borderRadius: radius, maxWidth: '100%' }}
    >
      <picture>
        <source media="(prefers-reduced-motion: reduce)" srcSet={still} />
        <img
          src={animated ? resolve(src) : still}
          loading="lazy"
          decoding="async"
          width={width}
          height={height}
          alt={alt}
          className="block h-full w-full"
          data-animated={animated ? 'true' : 'false'}
        />
      </picture>
    </div>
  );
}
