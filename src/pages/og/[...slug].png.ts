import type { APIRoute } from "astro";
import { renderOgPng, type OgCard } from "../../lib/og";
import { getShowcase } from "../../lib/showcase";
import { splitBlurb } from "../../../showcase/render.mjs";
import { SITE } from "../../lib/site";

// A social preview card for every page but the home page (that one is /og.png), built at build time:
// the same blueprint sheet, with each page's own title, stamp and note from Pip.
const STAMPS: Record<string, string> = { done: "Shipped", wip: "In progress", live: "Live", archived: "Archived" };
const seeIt = (path: string): [string, string] => ["See it at", `${SITE.domain}${path}`];

export async function getStaticPaths() {
  const data = await getShowcase();
  const order = [...data.featured, ...data.repos.filter((r) => !r.featured).map((r) => r.name)];
  const repos = order.map((n) => data.repos.find((r) => r.name === n)!);

  const cards: { slug: string; card: OgCard }[] = [
    {
      slug: "about",
      card: {
        title: "About Charles",
        subtitle: "How I vibe-code the little things in my workshop, and what's on the bench right now.",
        eyebrow: "Sheet 05 · About",
        note: "say hi!",
        stamp: "Hello",
        titleblock: [["Drawn by", "Charles"], ["Sheet", "05"], seeIt("/about/")],
      },
    },
    {
      slug: "log",
      card: {
        title: "Workshop log",
        subtitle: "Every commit, release and new project across the workbench, newest first.",
        eyebrow: "Sheet 06 · Workshop log",
        note: "what's new?",
        stamp: "Updated often",
        titleblock: [["Drawn by", "Charles"], ["Sheet", "06"], seeIt("/log/")],
      },
    },
    ...repos.map((repo, i) => {
      const r = repo as typeof repo & { blurb?: string | null; status?: string | null };
      const sheet = `P-${String(i + 1).padStart(2, "0")}`;
      return {
        slug: `projects/${repo.name}`,
        card: {
          title: repo.title,
          subtitle: splitBlurb(r.blurb || repo.description || "")[0] || "One of the little things in my workshop.",
          eyebrow: `Sheet ${sheet} · Spec sheet`,
          note: repo.name === "pip" ? "this is Pip!" : "Pip approves",
          stamp: STAMPS[r.status ?? ""] ?? "Spec sheet",
          titleblock: [["Language", repo.language?.name ?? "Various"], ["Sheet", sheet], ["Source", `NXT549/${repo.name}`]],
        } satisfies OgCard,
      };
    }),
  ];
  return cards.map(({ slug, card }) => ({ params: { slug }, props: { card } }));
}

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOgPng(props.card as OgCard);
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
};
