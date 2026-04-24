import * as Football from "./footballConfig";
import * as Music from "./musicConfig";

export const COLLECTIONS_MAP: Record<string, any> = {
  football: Football,
  music: Music,
};

export type CollectionId = keyof typeof COLLECTIONS_MAP;