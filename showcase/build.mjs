#!/usr/bin/env node
// Builds the GitHub showcase.
//
//   node showcase/build.mjs              fetch from GitHub, update data/, render into index.html
//   node showcase/build.mjs --offline    no network: re-apply showcase/config.json to the cached
//                                        data/github-raw.json and re-render (use after editing the config)
//   node showcase/build.mjs --data FILE  render from another data file (no network, data/ untouched)
//   node showcase/build.mjs --check      fail if data/github.json or index.html is out of date
//   node showcase/build.mjs --strict     fail instead of keeping the old data when GitHub can't be reached
//   node showcase/build.mjs --summary    print a Markdown summary of data/github.json
//
// Token (optional): SHOWCASE_TOKEN, GITHUB_TOKEN or GH_TOKEN. Without one it uses the
// anonymous REST API (60 requests an hour), which is plenty for a personal account.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchRaw, normalize } from "./fetch.mjs";
import { renderInto } from "./render.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG = resolve(ROOT, "showcase/config.json");
const DATA = resolve(ROOT, "data/github.json");
const RAW = resolve(ROOT, "data/github-raw.json");
const INDEX = resolve(ROOT, "index.html");

const args = new Set(process.argv.slice(2));
const dataArg = process.argv.includes("--data") ? process.argv[process.argv.indexOf("--data") + 1] : null;

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
}

const stable = (data) => JSON.stringify({ ...data, generatedAt: null });

function summary(data) {
  const lines = [
    `### GitHub showcase`,
    ``,
    `${data.repos.length} projects from **${data.user.login}**, ${data.featured.length} in the spotlight (${data.featured.join(", ") || "none"}).`,
    ``,
    `| Repo | Language | Frameworks | Topics | ★ | Release | Last commit |`,
    `| --- | --- | --- | --- | --- | --- | --- |`,
    ...data.repos.map((r) =>
      [
        r.featured ? `**${r.name}**` : r.name,
        r.language ? r.language.name : "",
        r.frameworks.join(", "),
        r.topics.join(", "),
        r.stars,
        r.release ? r.release.tag : "",
        r.latestCommit ? `${r.latestCommit.date.slice(0, 10)} ${r.latestCommit.message.replace(/\|/g, "\\|").slice(0, 60)}` : "",
      ].join(" | ").replace(/^/, "| ").replace(/$/, " |")
    ),
  ];
  return lines.join("\n");
}

async function writeIfChanged(path, value) {
  const text = JSON.stringify(value, null, 2) + "\n";
  const old = await readFile(path, "utf8").catch(() => null);
  if (old === text) return false;
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, text);
  return true;
}

async function main() {
  const config = await readJson(CONFIG);
  const check = args.has("--check");
  let data;

  if (args.has("--summary")) {
    console.log(summary(await readJson(DATA)));
    return;
  }

  const previous = await readJson(DATA);
  // Keep the old timestamp when nothing else changed, so there's nothing to commit.
  const settle = (next) => (previous && stable(previous) === stable(next) ? previous : next);

  if (dataArg) {
    data = await readJson(resolve(process.cwd(), dataArg));
  } else if (args.has("--offline") || check) {
    const raw = await readJson(RAW);
    if (raw) data = settle(normalize(raw, config, { generatedAt: previous ? previous.generatedAt : undefined }));
    else data = previous;
    if (!data) throw new Error("No cached GitHub data in data/ yet. Run without --offline first.");
  } else {
    const token = process.env.SHOWCASE_TOKEN || process.env.GITHUB_TOKEN || process.env.GH_TOKEN || null;
    try {
      const raw = await fetchRaw(config, { token, log: (m) => console.log(m) });
      await writeIfChanged(RAW, raw);
      data = settle(normalize(raw, config));
    } catch (err) {
      if (args.has("--strict") || !previous) throw err;
      // Offline or rate-limited: keep what we had so the site still builds.
      console.warn(`::warning::Couldn't refresh GitHub data, keeping the previous data. ${err.message}`);
      data = previous;
    }
  }

  const html = await readFile(INDEX, "utf8");
  const next = renderInto(html, data);
  if (check) {
    const stale = [];
    if (data !== previous) stale.push("data/github.json");
    if (next !== html) stale.push("index.html");
    if (stale.length) {
      console.error(`${stale.join(" and ")} out of date. Run: node showcase/build.mjs --offline`);
      process.exit(1);
    }
    console.log("data/github.json and index.html are up to date");
    return;
  }
  if (!dataArg && data !== previous && (await writeIfChanged(DATA, data))) {
    console.log(`Wrote data/github.json (${data.repos.length} repos, featured: ${data.featured.join(", ") || "none"})`);
  }
  if (next !== html) {
    await writeFile(INDEX, next);
    console.log("Rendered the showcase into index.html");
  } else {
    console.log("index.html already up to date");
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
