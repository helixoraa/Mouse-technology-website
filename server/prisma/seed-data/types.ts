export type PageSeed = {
  page: string;
  seo: { title: string; description: string };
  sections: { key: string; order: number; content: Record<string, unknown> }[];
};
