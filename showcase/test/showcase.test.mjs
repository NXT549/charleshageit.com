// Run with: node --test showcase/test/
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { commitHeadline, detectFrameworks, readmeExcerpt, releaseDownloads, slugify } from "../detect.mjs";
import { fetchShowcase, fetchViaGraphQL, homepageUrl, normalize, RateLimitError } from "../fetch.mjs";
import { inject, renderInto, renderRepoGrid, renderSpotlight, safeUrl } from "../render.mjs";

const fixture = JSON.parse(readFileSync(new URL("./fixtures/graphql.json", import.meta.url), "utf8"));
const config = JSON.parse(readFileSync(new URL("../config.json", import.meta.url), "utf8"));
const nodes = fixture.data.user.repositories.nodes;

const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });

function graphqlFetch(calls = []) {
  return async (url, init) => {
    calls.push(url);
    assert.equal(url, "https://api.github.com/graphql");
    assert.match(init.headers.Authorization, /^Bearer /);
    return json(fixture);
  };
}

// The same repos as the GraphQL fixture, served the way the REST API and raw.githubusercontent.com would.
function restFetch(calls = []) {
  const byName = new Map(nodes.map((n) => [n.name, n]));
  return async (url) => {
    calls.push(url);
    const u = new URL(url);
    if (u.hostname === "raw.githubusercontent.com") {
      const [, , repo, , ...rest] = u.pathname.split("/");
      const n = byName.get(repo);
      const file = rest.join("/");
      const blob = {
        "package.json": n.packageJson,
        "requirements.txt": n.requirements,
        "pyproject.toml": n.pyproject,
        "README.md": n.readme,
        "readme.md": n.readmeLower,
      }[file];
      return blob ? new Response(blob.text) : new Response("404: Not Found", { status: 404 });
    }
    if (u.pathname === "/users/NXT549") {
      return json({ login: "NXT549", name: "Charles", avatar_url: "a", html_url: "https://github.com/NXT549", bio: null, followers: 3, public_repos: 7 });
    }
    if (u.pathname === "/users/NXT549/repos") {
      return json(
        nodes.map((n) => ({
          name: n.name,
          full_name: n.nameWithOwner,
          html_url: n.url,
          description: n.description,
          homepage: n.homepageUrl,
          stargazers_count: n.stargazerCount,
          forks_count: n.forkCount,
          fork: n.isFork,
          archived: n.isArchived,
          private: n.isPrivate,
          created_at: n.createdAt,
          updated_at: n.updatedAt,
          pushed_at: n.pushedAt,
          language: n.primaryLanguage && n.primaryLanguage.name,
          topics: n.repositoryTopics.nodes.map((t) => t.topic.name),
        }))
      );
    }
    const m = u.pathname.match(/^\/repos\/NXT549\/([^/]+)\/(commits|releases\/latest)$/);
    if (m) {
      const n = byName.get(m[1]);
      if (m[2] === "commits") {
        const c = n.defaultBranchRef && n.defaultBranchRef.target;
        return c
          ? json([{ sha: c.oid, html_url: c.url, commit: { message: c.messageHeadline + "\n\nbody", committer: { date: c.committedDate } } }])
          : json({ message: "Git Repository is empty." }, 409);
      }
      const r = n.latestRelease;
      return r
        ? json({
            tag_name: r.tagName,
            name: r.name,
            published_at: r.publishedAt,
            html_url: r.url,
            assets: r.releaseAssets.nodes.map((a) => ({ name: a.name, browser_download_url: a.downloadUrl })),
          })
        : json({ message: "Not Found" }, 404);
    }
    throw new Error("unexpected request " + url);
  };
}

const NOW = "2026-10-09T13:00:00.000Z";

async function graphqlData() {
  const raw = await fetchViaGraphQL({ login: "NXT549", token: "t", fetchImpl: graphqlFetch() });
  return normalize(raw, config, { generatedAt: NOW });
}

// ---------------------------------------------------------------- detect

test("slugify handles languages with symbols", () => {
  assert.equal(slugify("C++"), "cpp");
  assert.equal(slugify("C#"), "csharp");
  assert.equal(slugify("Jupyter Notebook"), "jupyter-notebook");
});

test("detects frameworks from manifests, topics and overrides", () => {
  assert.deepEqual(detectFrameworks({ packageJson: '{"devDependencies":{"vite":"6","typescript":"5"}}' }), ["vite"]);
  assert.deepEqual(detectFrameworks({ packageJson: '{"devDependencies":{"electron":"33"}}', topics: ["electron-app"] }), ["electron"]);
  assert.deepEqual(detectFrameworks({ requirements: "# comment flask\nrequests==2\nFlask>=3.0\n" }), ["flask"]);
  assert.deepEqual(detectFrameworks({ pyproject: '[project]\ndependencies = [\n  "pygame-ce>=2",\n]' }), ["pygame"]);
  assert.deepEqual(detectFrameworks({ packageJson: '{"main":"index.js","dependencies":{"chalk":"5"}}' }), ["nodejs"]);
  assert.deepEqual(detectFrameworks({ packageJson: '{"dependencies":{"@sveltejs/kit":"2","svelte":"5"}}' }), ["sveltekit"]);
  assert.deepEqual(detectFrameworks({ topics: ["nextjs", "game"], extra: ["Phaser"] }), ["nextjs", "phaser"]);
  assert.deepEqual(detectFrameworks({ packageJson: "not json" }), []);
});

test("README excerpt skips badges, images and headings and keeps inline code", () => {
  const md = nodes.find((n) => n.name === "hamster-slots").readme.text;
  const out = readmeExcerpt(md);
  assert.match(out, /^A cute pixel-art idle slot machine, powered by a hamster on a wheel\./);
  assert.doesNotMatch(out, /badge|\*\*|<|#|!\[/);
  assert.match(readmeExcerpt("Run it with `npm run dev` and then open the browser at localhost."), /`npm run dev`/);
  const long = readmeExcerpt("word ".repeat(200), 100);
  assert.ok(long.length <= 100 && long.endsWith("…"));
  assert.equal(readmeExcerpt("# Title only\n\n![img](x.png)"), null);
  assert.equal(readmeExcerpt(null), null);
});

test("release downloads pick one asset per platform and skip blockmaps", () => {
  const assets = nodes.find((n) => n.name === "pip").latestRelease.releaseAssets.nodes.map((a) => ({ name: a.name, url: a.downloadUrl }));
  assert.deepEqual(
    releaseDownloads(assets).map((d) => [d.platform, d.name]),
    [["windows", "Pip-Setup-1.2.0.exe"], ["macos", "Pip-1.2.0-arm64.dmg"]]
  );
  assert.deepEqual(releaseDownloads([{ name: "app-linux-x64.tar.gz", url: "u" }, { name: "checksums.txt", url: "u" }]).map((d) => d.platform), ["linux"]);
  assert.deepEqual(releaseDownloads([{ name: "Pip-1.2.0-arm64-mac.zip", url: "u" }, { name: "Pip-win.zip", url: "u" }]).map((d) => d.platform), ["windows", "macos"]);
  // an expected platform with no asset falls back to the release page
  assert.deepEqual(releaseDownloads([{ name: "Pip-Setup.exe", url: "exe" }], { expected: ["windows", "macos"], releaseUrl: "rel" }), [
    { platform: "windows", label: "Windows", name: "Pip-Setup.exe", url: "exe" },
    { platform: "macos", label: "macOS", name: null, url: "rel" },
  ]);
});

test("merge commits show the pull request title", () => {
  assert.equal(commitHeadline("Merge pull request #13 from NXT549/claude/x", "\nAdd the Welcome Mat\n\nmore"), "Add the Welcome Mat (#13)");
  assert.equal(commitHeadline("Merge pull request #13 from NXT549/claude/x", ""), "Merge pull request #13 from NXT549/claude/x");
  assert.equal(commitHeadline("Fix the reels", "body"), "Fix the reels");
});

test("homepages without a scheme get https, anything else is dropped", () => {
  assert.equal(homepageUrl("charleshageit.com"), "https://charleshageit.com");
  assert.equal(homepageUrl("https://nxt549.github.io/x/"), "https://nxt549.github.io/x/");
  assert.equal(homepageUrl("javascript:alert(1)"), null);
  assert.equal(homepageUrl(""), null);
});

// ---------------------------------------------------------------- normalise

test("hides configured repos, forks and the profile repo; orders by last push", async () => {
  const data = await graphqlData();
  assert.deepEqual(data.repos.map((r) => r.name), ["hamster-slots", "pip", "weather-bot"]);
});

test("featured comes from the config list first, then the featured topic", async () => {
  const data = await graphqlData();
  assert.deepEqual(data.featured, ["hamster-slots", "pip"]);
  const topicOnly = normalize(
    await fetchViaGraphQL({ login: "NXT549", token: "t", fetchImpl: graphqlFetch() }),
    { ...config, featured: [] },
    { generatedAt: NOW }
  );
  assert.deepEqual(topicOnly.featured, ["hamster-slots"]);
});

test("repos carry filterable language, frameworks, topics and tags", async () => {
  const data = await graphqlData();
  const hs = data.repos.find((r) => r.name === "hamster-slots");
  assert.deepEqual(hs.language, { name: "TypeScript", slug: "typescript", color: "#3178c6" });
  assert.deepEqual(hs.frameworks, ["vite"]);
  assert.deepEqual(hs.topics, ["game", "pixel-art", "idle-game"]); // "featured" is dropped
  assert.deepEqual(hs.tags, ["typescript", "vite", "game", "pixel-art", "idle-game"]);
  assert.equal(hs.languages[0].share, 90);
  assert.equal(hs.release.tag, "v1.9.1");
  assert.equal(hs.latestCommit.shortSha, "a1b2c3d");
  assert.equal(hs.homepage, "https://nxt549.github.io/hamster-slots/");
  assert.equal(hs.embed, "https://nxt549.github.io/hamster-slots/");

  const pip = data.repos.find((r) => r.name === "pip");
  assert.deepEqual(pip.frameworks, ["electron"]);
  assert.equal(pip.readmeExcerpt, "Pip is a tiny pixel-art jellybean who lives on your desktop and reminds you to drink water.");
  assert.equal(pip.homepage, null);

  const bot = data.repos.find((r) => r.name === "weather-bot");
  assert.deepEqual(bot.frameworks, ["flask"]);
  assert.equal(bot.homepage, null);

  assert.deepEqual(data.facets.languages.map((f) => [f.slug, f.label, f.count]), [
    ["javascript", "JavaScript", 1],
    ["python", "Python", 1],
    ["typescript", "TypeScript", 1],
  ]);
  assert.deepEqual(data.facets.frameworks.map((f) => f.label), ["Electron", "Flask", "Vite"]);
  assert.equal(data.user.lastPushRepo, "charleshageit.com");
  assert.equal(data.user.totalStars, 1240);
});

// ---------------------------------------------------------------- fetching

test("without a token it uses REST and stays well inside the anonymous rate limit", async () => {
  const calls = [];
  const data = await fetchShowcase(config, { token: null, fetchImpl: restFetch(calls) });
  const api = calls.filter((u) => u.startsWith("https://api.github.com"));
  assert.equal(api.length, 2 + 2 * data.repos.length); // user + repo list, then commits + release per shown repo
  assert.ok(!api.some((u) => /python-scripts|some-fork|charleshageit/.test(u)), "no requests for hidden repos");

  const viaGraphQL = await graphqlData();
  const strip = (d) => d.repos.map((r) => ({ ...r, languages: null }));
  assert.deepEqual(strip({ ...data, generatedAt: NOW }), strip(viaGraphQL));
});

test("falls back to REST when GraphQL fails", async () => {
  const rest = restFetch();
  const logs = [];
  const fetchImpl = async (url, init) => (url.endsWith("/graphql") ? json({ message: "Bad credentials" }, 401) : rest(url, init));
  const data = await fetchShowcase(config, { token: "t", fetchImpl, log: (m) => logs.push(m) });
  assert.equal(data.repos.length, 3);
  assert.match(logs.join("\n"), /falling back to REST/);
});

test("a rate limit is reported, not swallowed", async () => {
  const fetchImpl = async () => json({ message: "API rate limit exceeded" }, 403, { "x-ratelimit-remaining": "0", "x-ratelimit-reset": "1791554952" });
  await assert.rejects(fetchShowcase(config, { fetchImpl }), RateLimitError);
});

// ---------------------------------------------------------------- rendering

test("rendering escapes GitHub text and drops unsafe URLs", async () => {
  const html = renderRepoGrid(await graphqlData());
  assert.ok(!html.includes("<script>alert(1)</script>"));
  assert.ok(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));
  assert.ok(!/href="javascript:/i.test(html));
  assert.ok(html.includes("<code>#general</code>"));
  assert.ok(html.includes("Handle &quot;rain&quot; &amp; &lt;hail&gt;"));
  assert.equal(safeUrl("javascript:alert(1)"), null);
  assert.equal(safeUrl("../secret"), null);
  assert.equal(safeUrl("./img/a.webp"), "./img/a.webp");
});

test("project cards expose data attributes for filtering", async () => {
  const html = renderRepoGrid(await graphqlData());
  assert.equal((html.match(/<article class="repo-card /g) || []).length, 3);
  assert.match(html, /data-repo="hamster-slots" data-language="typescript" data-frameworks="vite" data-topics="game pixel-art idle-game"/);
  assert.match(html, /<time datetime="2026-10-07T09:00:00.000Z" data-relative>7 Oct 2026<\/time>/);
  assert.match(html, /1\.2k<span class="visually-hidden"> stars/);
});

test("spotlight shows the README, release downloads, live link and demo", async () => {
  const html = renderSpotlight(await graphqlData());
  assert.ok(html.indexOf('id="project-hamster-slots"') < html.indexOf('id="project-pip"'));
  assert.match(html, /data-embed="https:\/\/nxt549\.github\.io\/hamster-slots\/"/);
  assert.match(html, /Play it live/);
  assert.match(html, /href="https:\/\/github\.com\/NXT549\/pip\/releases\/download\/v1\.2\.0\/Pip-Setup-1\.2\.0\.exe"[^>]*>.*Windows/);
  assert.match(html, />.*macOS<\/a>/);
  assert.match(html, /README\.md/);
  // hamster-slots' README just restates its blurb, so only Pip's README is shown
  assert.equal((html.match(/<figure class="terminal spotlight__readme">/g) || []).length, 1);
  assert.ok(html.indexOf("spotlight__readme") > html.indexOf('id="project-pip"'));
  assert.match(html, /spotlight__shot--pixel/);
  assert.match(html, /<symbol id="i-star"/);
});

test("injection replaces only the marked regions and is repeatable", async () => {
  const data = await graphqlData();
  const page = `<main>
    <section id="spotlight">
      <!-- showcase:spotlight:start -->old<!-- showcase:spotlight:end -->
    </section>
    <section id="workbench"><!-- showcase:repos:start -->
    <!-- showcase:repos:end --></section>
  </main>`;
  const once = renderInto(page, data);
  assert.ok(!once.includes(">old<"));
  assert.equal(renderInto(once, data), once);
  assert.ok(once.startsWith("<main>\n    <section id=\"spotlight\">"));
  assert.throws(() => inject("<p>no markers</p>", "repos", "x"), /missing the <!-- showcase:repos:start -->/);
});
