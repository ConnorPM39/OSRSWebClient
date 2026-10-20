// Cloudflare Worker that passes OSRS hiscores requests through and adds
// the CORS header browsers need. Usage: https://<worker-url>/?player=Zezima
const HISCORES_URL = "https://secure.runescape.com/m=hiscore_oldschool/index_lite.json";

export default {
  async fetch(request) {
    const player = new URL(request.url).searchParams.get("player");
    if (!player) {
      return reply(JSON.stringify({ error: "Add ?player=NAME to the URL" }), 400);
    }

    const upstream = await fetch(`${HISCORES_URL}?player=${encodeURIComponent(player)}`);
    return reply(await upstream.text(), upstream.status);
  },
};

function reply(body, status) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "max-age=60",
    },
  });
}
