// The GitHub showcase data, fetched once per build and shared by every component that needs it.
// Fetching and rendering live in showcase/ (plain Node, with its own tests); this only decides
// where the data comes from: fresh from GitHub when possible, otherwise the committed cache.
import { fetchShowcase, normalize } from "../../showcase/fetch.mjs";
import config from "../../showcase/config.json";
import committed from "../../data/github.json";
import raw from "../../data/github-raw.json";

export interface Facet {
  slug: string;
  label: string;
  count: number;
}

export interface Repo {
  name: string;
  title: string;
  url: string;
  description: string | null;
  homepage: string | null;
  featured: boolean;
  stars: number;
  language: { name: string; slug: string; color: string | null } | null;
  frameworks: string[];
  topics: string[];
  tags: string[];
  pushedAt: string | null;
  [key: string]: unknown;
}

export interface Showcase {
  generatedAt: string | null;
  user: {
    login: string;
    url: string;
    lastPushAt: string | null;
    lastPushRepo: string | null;
    totalStars: number;
    [key: string]: unknown;
  };
  featured: string[];
  facets: { languages: Facet[]; frameworks: Facet[]; topics: Facet[] };
  repos: Repo[];
}

// The cached API response with today's showcase/config.json applied, so card edits show up
// without a fetch (the same as `node showcase/build.mjs --offline`).
function offline(): Showcase {
  return normalize(raw, config, { generatedAt: committed.generatedAt ?? undefined }) as Showcase;
}

async function load(): Promise<Showcase> {
  // SHOWCASE_OFFLINE=1 builds from the cache without touching the network.
  if (!process.env.SHOWCASE_OFFLINE) {
    const token = process.env.SHOWCASE_TOKEN || process.env.GITHUB_TOKEN || process.env.GH_TOKEN || null;
    try {
      // fetch.mjs is plain JS and its `token = null` default makes TypeScript think null is the only type.
      const data: Showcase = await fetchShowcase(config, { token: token as null });
      console.log(`[showcase] fetched ${data.repos.length} repos from GitHub`);
      return data;
    } catch (err) {
      const prefix = process.env.GITHUB_ACTIONS ? "::warning::" : "";
      console.warn(`${prefix}[showcase] couldn't reach GitHub (${(err as Error).message}), using the cached data`);
    }
  }
  return offline();
}

let cached: Promise<Showcase> | undefined;

/** The showcase data for this build. Every caller shares the same fetch. */
export function getShowcase(): Promise<Showcase> {
  return (cached ??= load());
}
