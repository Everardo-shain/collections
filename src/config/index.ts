/**
 * CONFIG HUB — Central registry for all collections.
 * Components should import shared utils/types from "@/utils/collectionUtils"
 * and access collection-specific config via the `useCollection()` hook.
 */

import * as Football from "./footballConfig";
import * as Music from "./musicConfig";
const BASE_PATH = import.meta.env.BASE_URL.endsWith('/') 
  ? import.meta.env.BASE_URL 
  : `${import.meta.env.BASE_URL}/`;
  
export type CollectionConfig = typeof Football;

export const COLLECTIONS_MAP: Record<string, CollectionConfig> = {
  football: Football,
  music: Music as unknown as CollectionConfig,
};

export type CollectionId = keyof typeof COLLECTIONS_MAP;

export const DEFAULT_COLLECTION_ID: CollectionId = "football";

/** Metadatos genéricos del sitio (SEO base) */
export const SITE_METADATA = {
  title: "Everardo´s Collections",
  description: "A curated digital archive of personal collections.",
  author: "Everardo",
  ogImage: `${BASE_PATH}site/og-image.png`,
  lightAccentColor: "1 0% 0%",
  darkAccentColor: "1 0% 100%",
  logo: `${BASE_PATH}site/logo.svg`,
  favIcon: `${BASE_PATH}site/favicon.png`,
} as const;

// Re-exports de utilidades compartidas para conveniencia
export * from "@/utils/collectionUtils";
