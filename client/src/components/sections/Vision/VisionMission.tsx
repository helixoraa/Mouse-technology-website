import { InnerBand } from '../InnerBand';

export interface VisionMissionContent {
  vision: { label: string; text: string };
  mission: { label: string; text: string };
}

export function VisionMission({ content }: { content: VisionMissionContent }) {
  return (
    <InnerBand tone="soft">
      <div className="flex flex-col gap-6 md:flex-row">
        <article className="flex flex-1 flex-col gap-7 rounded-xl4 border border-white/25 bg-vision-card p-8 text-white md:p-14">
          <h2 className="text-xl font-extrabold uppercase tracking-[0.16em] md:text-2xl">{content.vision.label}</h2>
          <p className="text-[26px] font-bold leading-9 tracking-[-0.01em] md:text-[34px] md:leading-[46px]">{content.vision.text}</p>
        </article>
        <article className="flex flex-1 flex-col gap-7 rounded-xl4 border border-line bg-white p-8 shadow-card md:p-14">
          <h2 className="text-xl font-extrabold uppercase tracking-[0.16em] text-brand">{content.mission.label}</h2>
          <p className="text-[22px] font-bold leading-8 tracking-[-0.01em] text-ink md:text-[28px] md:leading-10">{content.mission.text}</p>
        </article>
      </div>
    </InnerBand>
  );
}
