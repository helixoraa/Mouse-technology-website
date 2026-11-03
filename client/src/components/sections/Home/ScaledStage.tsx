import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Renders absolutely-positioned artwork (UI mockups) on a fixed design canvas and scales it down
 * to fit narrower containers, so the 1440 Figma composition stays identical and never overflows.
 */
export function ScaledStage({
  width,
  height,
  children,
  className = '',
}: {
  width: number;
  height: number;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / width));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  return (
    <div ref={ref} aria-hidden className={`relative w-full ${className}`} style={{ height: height * scale }}>
      <div className="absolute left-0 top-0 origin-top-left" style={{ width, height, transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}
