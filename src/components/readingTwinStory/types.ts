export type StoryVariant =
  | 'variant_a_circles'
  | 'variant_b_minimal'
  | 'variant_c_gradient_sticker';

export interface TheyAlsoRead {
  workId: number;
  title: string;
  photo?: string;
}

export interface ReadingTwinStoryTemplateProps {
  myUserName?: string;
  myName?: string;
  myProfilePic?: string;
  twinName: string;
  twinUserName: string;
  twinProfilePic?: string;
  matchScore: number;
  sharedWorks: number;
  covers?: TheyAlsoRead[];
  variant?: StoryVariant;
}
