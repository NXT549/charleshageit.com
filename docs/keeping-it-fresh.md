# Keeping the site fresh

The site is static, so "updating" means rebuilding. A rebuild re-reads every public repo of `NXT549`
and redeploys. These are the triggers, from automatic to manual.

| Trigger | When | Setup |
| --- | --- | --- |
| Push to `main` in this repo | every change to the site | none |
| Schedule | every 6 hours (`23 */6 * * *`) | none; catches new repos, stars, commits, releases |
| `repository_dispatch` (`repo-updated`) | right after another repo changes | one workflow + one secret per repo (below) |
| Manual | on demand | Actions tab > Build and deploy > Run workflow |

The 6-hourly schedule alone already picks up everything, within hours. The dispatch is only for
"I just shipped, show it now". Pull requests build and run Lighthouse but never deploy.

## Rebuild when another repo changes (optional)

1. Create a fine-grained personal access token with access to `NXT549/charleshageit.com` only and the
   **Contents: read and write** permission (GitHub requires this to send a dispatch event).
2. In each other repo, add it as an Actions secret named `SITE_DISPATCH_TOKEN`.
3. Copy `docs/notify-site.yml` into that repo as `.github/workflows/notify-site.yml`.

It fires on pushes to the default branch and on published releases, and the site rebuilds within a minute or two.
Repos without it are still picked up by the schedule. Nothing is added to other repos automatically.

## Optional: a higher API rate limit or private-repo stats

Add a repo secret `SHOWCASE_TOKEN` (a personal token) to this repo. The build uses it in place of the default
`GITHUB_TOKEN`. Without it the build still works with public data.

## When a rebuild shows nothing new

- GitHub Pages Source must be **GitHub Actions** (Settings > Pages).
- Check the latest **Build and deploy** run. If GitHub was unreachable the build falls back to `data/github-raw.json`,
  with the current `showcase/config.json` applied.
- A repo needs to be public, not a fork, not archived and not listed under `hide`.
