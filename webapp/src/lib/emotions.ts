/** Five emotion presets — palette + accent — per DESIGN.md §9.5. */
export const EMOTION_IDS = ['stillness', 'reverie', 'unease', 'anguish', 'fury'] as const;
export type EmotionId = (typeof EMOTION_IDS)[number];

export interface EmotionPreset {
  palette: string[];
  accent: string;
  blurb: string;
}

export const EMOTIONS: Record<EmotionId, EmotionPreset> = {
  stillness: {
    palette: ['var(--s-bone)', 'var(--ground-5)', 'var(--ground-4)'],
    accent: 'var(--s-bone)',
    blurb: 'frozen, neutral.',
  },
  reverie: {
    palette: ['var(--s-gold)', 'var(--s-amber)', 'var(--ground-4)', 'var(--s-bone)'],
    accent: 'var(--s-gold)',
    blurb: 'gold + amber, slow swing.',
  },
  unease: {
    palette: ['var(--s-mauve)', 'var(--s-blue)', 'var(--ground-3)', 'var(--s-bone)'],
    accent: 'var(--s-mauve)',
    blurb: 'mauve + blue, faster.',
  },
  anguish: {
    palette: ['var(--s-rose)', 'var(--s-mauve)', 'var(--ground-3)', 'var(--s-bone)'],
    accent: 'var(--s-rose)',
    blurb: 'rose + mauve, fast.',
  },
  fury: {
    palette: ['var(--s-rose)', 'var(--s-amber)', 'var(--s-gold)', 'var(--ground-3)'],
    accent: 'var(--s-rose)',
    blurb: 'rose + amber, fastest.',
  },
};
