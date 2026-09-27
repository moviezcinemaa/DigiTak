export interface MovieNews {
  _id: string;
  title: string;
  slug: { current: string };
  poster?: {
    asset: { _ref: string };
    hotspot?: { x: number; y: number };
  };
  financialNews?: unknown[];
  youtubeReactions?: string;
  telegramLink: string;
}
