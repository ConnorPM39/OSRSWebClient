# OSRS Stats

A single page that looks up an Old School RuneScape character on the official hiscores and shows their skills, ranks, boss kill counts, clues, minigames and collection log count.

Built with plain HTML, CSS and JavaScript, no framework or build step.

## Files

| File | What it does |
| --- | --- |
| `index.html` | Page structure: search box, view tabs, skill grid, lists |
| `styles.css` | All the look and effects: level colors, wave, rainbow 99 borders |
| `app.js` | Fetches the data, builds the tiles, switches tabs |
| `worker/worker.js` | Tiny Cloudflare Worker that proxies the hiscores (see below) |

## Try it

Open `index.html` in a browser and click **Try demo data**. That uses random stats so you can work on the CSS without any setup.

## Looking up real players

The hiscores live at `https://secure.runescape.com/m=hiscore_oldschool/index_lite.json?player=NAME`. Jagex doesn't send CORS headers, so a browser page isn't allowed to read that response directly. The Worker fetches it for you and adds the header.

1. Make a free account at [Cloudflare](https://dash.cloudflare.com/).
2. Go to **Workers & Pages → Create → Create Worker**, then **Edit code**.
3. Replace the code with the contents of `worker/worker.js` and click **Deploy**.
4. Copy the Worker's URL (like `https://osrs-hiscores.yourname.workers.dev`) into `PROXY_URL` at the top of `app.js`.

## Customizing

- **Colors:** the `--band-0` to `--band-9` variables at the top of `styles.css` set the color for each 10 levels.
- **Wave speed:** `--wave-step` in `styles.css`.
- **Icons:** `iconUrl()` in `app.js` points at the OSRS Wiki skill icons. Point it at your own images to restyle them.

## What the hiscores don't have

The hiscores only publish your total collection log count, not the individual items. A full item list would need a RuneLite sync service such as TempleOSRS.
