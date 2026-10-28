import type { APIRoute } from "astro";
import { FONTS, fontById } from "../../../lib/ascii";

// Each banner font as a small JSON file (/ascii/fonts/<id>.json). The sketchbook page carries the default
// font inline and the banner maker fetches the others only when someone picks one.
export function getStaticPaths() {
  return FONTS.map(({ id }) => ({ params: { font: id } }));
}

export const GET: APIRoute = ({ params }) =>
  new Response(JSON.stringify(fontById(String(params.font))), { headers: { "content-type": "application/json" } });
