// Fetches a GitHub user's public repos and turns them into the showcase data file.
//
// With a token (GITHUB_TOKEN in Actions) it makes one GraphQL request per 100 repos.
// Without one it falls back to the REST API, which costs 2 requests per shown repo plus 2,
// so it stays inside the 60 requests an hour GitHub allows anonymous callers.
// Manifests and READMEs come from raw.githubusercontent.com in REST mode, which isn't rate-limited the same way.

import { commitHeadline, detectFrameworks, frameworkLabel, language, readmeExcerpt, releaseDownloads, slugify } from "./detect.mjs";

const API = "https://api.github.com";
const RAW = "https://raw.githubusercontent.com";

export class RateLimitError extends Error {}

function headers(token) {
  const h = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "charleshageit.com-showcase",
  };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function request(fetchImpl, url, init = {}) {
  const res = await fetchImpl(url, { ...init, signal: AbortSignal.timeout(20000) });
  if ((res.status === 403 || res.status === 429) && (res.headers.get("x-ratelimit-remaining") === "0" || res.status === 429)) {
    const reset = Number(res.headers.get("x-ratelimit-reset")) * 1000;
    throw new RateLimitError(
      `GitHub rate limit hit${reset ? `, resets at ${new Date(reset).toISOString()}` : ""}. Set GITHUB_TOKEN to raise it.`
    );
  }
  return res;
}

async function getJson(fetchImpl, url, token, { allow404 = false } = {}) {
  const res = await request(fetchImpl, url, { headers: headers(token) });
  if (allow404 && res.status === 404) return null;
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.json();
}

async function getRaw(fetchImpl, fullName, path) {
  try {
    const res = await request(fetchImpl, `${RAW}/${fullName}/HEAD/${path}`, {
      headers: { "User-Agent": "charleshageit.com-showcase" },
    });
    return res.ok ? await res.text() : null;
  } catch (err) {
    if (err instanceof RateLimitError) throw err;
    return null;
  }
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

// ---------------------------------------------------------------- GraphQL

const QUERY = `
query Showcase($login: String!, $cursor: String) {
  user(login: $login) {
    login name avatarUrl url bio
    followers { totalCount }
    repositories(first: 100, after: $cursor, privacy: PUBLIC, ownerAffiliations: OWNER,
                 orderBy: { field: PUSHED_AT, direction: DESC }) {
      totalCount
      pageInfo { hasNextPage endCursor }
      nodes {
        name nameWithOwner url description homepageUrl
        stargazerCount forkCount isFork isArchived isPrivate
        createdAt updatedAt pushedAt
        primaryLanguage { name color }
        languages(first: 6, orderBy: { field: SIZE, direction: DESC }) { edges { size node { name color } } }
        repositoryTopics(first: 20) { nodes { topic { name } } }
        latestRelease {
          tagName name publishedAt url
          releaseAssets(first: 20) { nodes { name downloadUrl } }
        }
        defaultBranchRef {
          target { ... on Commit { oid abbreviatedOid messageHeadline messageBody committedDate url } }
        }
        packageJson: object(expression: "HEAD:package.json") { ... on Blob { text } }
        requirements: object(expression: "HEAD:requirements.txt") { ... on Blob { text } }
        pyproject: object(expression: "HEAD:pyproject.toml") { ... on Blob { text } }
        readme: object(expression: "HEAD:README.md") { ... on Blob { text } }
        readmeLower: object(expression: "HEAD:readme.md") { ... on Blob { text } }
      }
    }
  }
}`;

export function fromGraphQLRepo(node) {
  const commit = node.defaultBranchRef && node.defaultBranchRef.target;
  const rel = node.latestRelease;
  return {
    name: node.name,
    fullName: node.nameWithOwner,
    url: node.url,
    description: node.description,
    homepage: node.homepageUrl,
    stars: node.stargazerCount,
    forks: node.forkCount,
    isFork: node.isFork,
    isArchived: node.isArchived,
    isPrivate: node.isPrivate,
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
    pushedAt: node.pushedAt,
    primaryLanguage: node.primaryLanguage,
    languages: ((node.languages && node.languages.edges) || []).map((e) => ({
      name: e.node.name,
      color: e.node.color,
      size: e.size,
    })),
    topics: ((node.repositoryTopics && node.repositoryTopics.nodes) || []).map((t) => t.topic.name),
    release: rel
      ? {
          tag: rel.tagName,
          name: rel.name,
          date: rel.publishedAt,
          url: rel.url,
          assets: ((rel.releaseAssets && rel.releaseAssets.nodes) || []).map((a) => ({ name: a.name, url: a.downloadUrl })),
        }
      : null,
    latestCommit:
      commit && commit.oid
        ? {
            sha: commit.oid,
            shortSha: commit.abbreviatedOid,
            message: commitHeadline(commit.messageHeadline, commit.messageBody),
            date: commit.committedDate,
            url: commit.url,
          }
        : null,
    packageJson: node.packageJson && node.packageJson.text,
    requirements: node.requirements && node.requirements.text,
    pyproject: node.pyproject && node.pyproject.text,
    readme: (node.readme && node.readme.text) || (node.readmeLower && node.readmeLower.text) || null,
  };
}

export async function fetchViaGraphQL({ login, token, fetchImpl = fetch }) {
  const repos = [];
  let user = null;
  let cursor = null;
  do {
    const res = await request(fetchImpl, `${API}/graphql`, {
      method: "POST",
      headers: { ...headers(token), "Content-Type": "application/json" },
      body: JSON.stringify({ query: QUERY, variables: { login, cursor } }),
    });
    if (!res.ok) throw new Error(`GraphQL -> ${res.status}`);
    const body = await res.json();
    const u = body.data && body.data.user;
    if (!u) throw new Error(`GraphQL: ${(body.errors || []).map((e) => e.message).join("; ") || "user not found"}`);
    user = user || {
      login: u.login,
      name: u.name,
      avatarUrl: u.avatarUrl,
      url: u.url,
      bio: u.bio,
      followers: u.followers.totalCount,
      publicRepos: u.repositories.totalCount,
    };
    repos.push(...u.repositories.nodes.map(fromGraphQLRepo));
    cursor = u.repositories.pageInfo.hasNextPage ? u.repositories.pageInfo.endCursor : null;
  } while (cursor);
  return { user, repos };
}

// ---------------------------------------------------------------- REST

export function fromRestRepo(r) {
  return {
    name: r.name,
    fullName: r.full_name,
    url: r.html_url,
    description: r.description,
    homepage: r.homepage,
    stars: r.stargazers_count,
    forks: r.forks_count,
    isFork: r.fork,
    isArchived: r.archived,
    isPrivate: r.private,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    pushedAt: r.pushed_at,
    primaryLanguage: r.language ? { name: r.language, color: null } : null,
    languages: [],
    topics: r.topics || [],
    release: null,
    latestCommit: null,
    packageJson: null,
    requirements: null,
    pyproject: null,
    readme: null,
  };
}

const JS_LANGUAGES = new Set(["JavaScript", "TypeScript", "HTML", "CSS", "Vue", "Svelte", "Astro", "SCSS"]);

export async function fetchViaRest({ login, token, config, fetchImpl = fetch }) {
  const u = await getJson(fetchImpl, `${API}/users/${login}`, token);
  const user = {
    login: u.login,
    name: u.name,
    avatarUrl: u.avatar_url,
    url: u.html_url,
    bio: u.bio,
    followers: u.followers,
    publicRepos: u.public_repos,
  };

  const repos = [];
  for (let page = 1; page <= 10; page++) {
    const batch = await getJson(fetchImpl, `${API}/users/${login}/repos?type=owner&sort=pushed&per_page=100&page=${page}`, token);
    repos.push(...batch.map(fromRestRepo));
    if (batch.length < 100) break;
  }

  // Only spend requests on repos that will actually be shown.
  const shown = repos.filter((r) => isShown(r, config, login));
  await mapLimit(shown, 4, async (repo) => {
    const [commits, release] = await Promise.all([
      getJson(fetchImpl, `${API}/repos/${repo.fullName}/commits?per_page=1`, token, { allow404: true }).catch((e) => {
        if (e instanceof RateLimitError) throw e;
        return null; // empty repos answer 409
      }),
      getJson(fetchImpl, `${API}/repos/${repo.fullName}/releases/latest`, token, { allow404: true }),
    ]);
    const c = Array.isArray(commits) && commits[0];
    if (c) {
      const [headline, ...body] = String(c.commit.message).split("\n");
      repo.latestCommit = {
        sha: c.sha,
        shortSha: c.sha.slice(0, 7),
        message: commitHeadline(headline, body.join("\n")),
        date: c.commit.committer ? c.commit.committer.date : c.commit.author.date,
        url: c.html_url,
      };
    }
    if (release) {
      repo.release = {
        tag: release.tag_name,
        name: release.name,
        date: release.published_at,
        url: release.html_url,
        assets: (release.assets || []).map((a) => ({ name: a.name, url: a.browser_download_url })),
      };
    }
    const lang = repo.primaryLanguage && repo.primaryLanguage.name;
    const wantsJs = !lang || JS_LANGUAGES.has(lang);
    const wantsPy = lang === "Python" || lang === "Jupyter Notebook";
    [repo.packageJson, repo.requirements, repo.pyproject, repo.readme] = await Promise.all([
      wantsJs ? getRaw(fetchImpl, repo.fullName, "package.json") : null,
      wantsPy ? getRaw(fetchImpl, repo.fullName, "requirements.txt") : null,
      wantsPy ? getRaw(fetchImpl, repo.fullName, "pyproject.toml") : null,
      getRaw(fetchImpl, repo.fullName, "README.md").then((t) => t || getRaw(fetchImpl, repo.fullName, "readme.md")),
    ]);
    if (lang) repo.languages = [{ name: lang, color: null, size: 1 }];
  });

  return { user, repos };
}

// ---------------------------------------------------------------- normalise

export function isShown(repo, config, login) {
  const hide = new Set((config.hide || []).map((n) => n.toLowerCase()));
  if (hide.has(repo.name.toLowerCase())) return false;
  if (repo.isPrivate) return false;
  if (repo.isFork && !config.includeForks) return false;
  if (repo.isArchived && !config.includeArchived) return false;
  // The profile README repo (github.com/<login>/<login>) isn't a project.
  if (repo.name.toLowerCase() === String(login).toLowerCase()) return false;
  return true;
}

/** GitHub lets people save "example.com" as a homepage; give it a scheme. */
export function homepageUrl(value) {
  const s = String(value || "").trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  if (/^[\w-]+(\.[\w-]+)+(:\d+)?(\/\S*)?$/.test(s)) return "https://" + s;
  return null;
}

export function titleFromName(name) {
  return name
    .replace(/[-_]+/g, " ")
    .replace(/\b([a-z])/g, (m) => m.toUpperCase());
}

function facet(repos, pick, label) {
  const counts = new Map();
  for (const r of repos) for (const slug of pick(r)) counts.set(slug, (counts.get(slug) || 0) + 1);
  return [...counts]
    .map(([slug, count]) => ({ slug, label: label(slug), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

/** Turn raw repos (from either API) plus the config into the data the page is built from. */
export function normalize({ user, repos }, config, { generatedAt = new Date().toISOString() } = {}) {
  const login = config.user;
  const overrides = config.repos || {};
  const featuredTopic = config.featuredTopic === undefined ? "featured" : config.featuredTopic;
  const featuredOrder = (config.featured || []).map((n) => n.toLowerCase());
  const languageNames = new Map();

  const shown = repos
    .filter((r) => isShown(r, config, login))
    .map((r) => {
      const o = overrides[r.name] || {};
      const topics = [...new Set((r.topics || []).map(slugify))];
      const lang = language(r.primaryLanguage && r.primaryLanguage.name, r.primaryLanguage && r.primaryLanguage.color);
      if (lang) languageNames.set(lang.slug, lang.name);
      const totalSize = (r.languages || []).reduce((s, l) => s + (l.size || 0), 0) || 1;
      const frameworks = detectFrameworks({
        packageJson: r.packageJson,
        requirements: r.requirements,
        pyproject: r.pyproject,
        topics,
        extra: o.frameworks || [],
      });
      const homepage = homepageUrl(o.live || r.homepage);
      const featured =
        featuredOrder.includes(r.name.toLowerCase()) || Boolean(featuredTopic && topics.includes(slugify(featuredTopic)));
      const description = o.description || r.description || null;
      const excerpt = o.hideReadme ? null : readmeExcerpt(r.readme);
      return {
        name: r.name,
        title: o.title || titleFromName(r.name),
        fullName: r.fullName,
        url: r.url,
        description: description || (excerpt ? readmeExcerpt(r.readme, 140) : null),
        blurb: o.blurb || null,
        highlights: o.highlights || [],
        homepage,
        embed: o.embed ? (typeof o.embed === "string" ? o.embed : homepage) : null,
        image: o.image
          ? { src: o.image, alt: o.imageAlt || "", width: o.imageWidth || null, height: o.imageHeight || null, pixelArt: Boolean(o.pixelArt) }
          : null,
        status: o.status || null,
        featured,
        stars: r.stars || 0,
        forks: r.forks || 0,
        language: lang,
        languages: (r.languages || []).map((l) => ({
          ...language(l.name, l.color),
          share: Math.round(((l.size || 0) / totalSize) * 1000) / 10,
        })),
        topics: topics.filter((t) => !featuredTopic || t !== slugify(featuredTopic)),
        frameworks,
        tags: [],
        createdAt: r.createdAt,
        pushedAt: r.pushedAt,
        latestCommit: r.latestCommit || null,
        release: r.release
          ? {
              tag: r.release.tag,
              name: r.release.name || r.release.tag,
              date: r.release.date,
              url: r.release.url,
              downloads: releaseDownloads(r.release.assets, { expected: o.platforms || [], releaseUrl: r.release.url }),
            }
          : null,
        readmeExcerpt: excerpt,
      };
    })
    .sort((a, b) => String(b.pushedAt).localeCompare(String(a.pushedAt)));

  for (const r of shown) r.tags = [...new Set([r.language && r.language.slug, ...r.frameworks, ...r.topics].filter(Boolean))];

  const rank = (r) => {
    const i = featuredOrder.indexOf(r.name.toLowerCase());
    return i === -1 ? featuredOrder.length : i;
  };
  const featured = shown
    .filter((r) => r.featured)
    .sort((a, b) => rank(a) - rank(b) || b.stars - a.stars || String(b.pushedAt).localeCompare(String(a.pushedAt)))
    .map((r) => r.name);

  // Most recent push to a shown repo. Hidden ones (like this site, which the refresh
  // workflow itself pushes to) would make every refresh look like new activity.
  const lastPushed = shown
    .reduce((best, r) => (!best || String(r.pushedAt) > String(best.pushedAt) ? r : best), null);

  return {
    generatedAt,
    user: {
      ...user,
      lastPushAt: lastPushed ? lastPushed.pushedAt : null,
      lastPushRepo: lastPushed ? lastPushed.name : null,
      totalStars: shown.reduce((s, r) => s + r.stars, 0),
    },
    featured,
    facets: {
      languages: facet(shown, (r) => (r.language ? [r.language.slug] : []), (s) => languageNames.get(s) || s),
      frameworks: facet(shown, (r) => r.frameworks, frameworkLabel),
      topics: facet(shown, (r) => r.topics, (s) => s.replace(/-/g, " ")),
    },
    repos: shown,
  };
}

/** Fetch everything for config.user. GraphQL when there's a token, REST otherwise (or if GraphQL fails). */
export async function fetchShowcase(config, { token = null, fetchImpl = fetch, log = () => {} } = {}) {
  const login = config.user;
  let raw;
  if (token) {
    try {
      raw = await fetchViaGraphQL({ login, token, fetchImpl });
      log(`GraphQL: ${raw.repos.length} repos`);
    } catch (err) {
      if (err instanceof RateLimitError) throw err;
      log(`GraphQL failed (${err.message}), falling back to REST`);
    }
  }
  if (!raw) {
    raw = await fetchViaRest({ login, token, config, fetchImpl });
    log(`REST${token ? "" : " (no token)"}: ${raw.repos.length} repos`);
  }
  return normalize(raw, config);
}
