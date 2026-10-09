import type { APIRoute } from "astro";
import { renderOgPng } from "../lib/og";
import { SITE } from "../lib/site";

// The social preview card for the home page, built once at build time.
export const GET: APIRoute = async () => {
  const png = await renderOgPng({
    title: SITE.name,
    subtitle: SITE.shortDescription,
  });
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
};
