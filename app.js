// Paste your Cloudflare Worker URL here once it is deployed (see README).
// The browser can't call the Jagex hiscores directly because of CORS,
// so the Worker fetches it for us.
const PROXY_URL = "https://YOUR-WORKER.YOUR-NAME.workers.dev";

// The order skills appear in-game: 3 columns, read left to right, top to bottom.
const SKILL_LAYOUT = [
  "Attack", "Hitpoints", "Mining",
  "Strength", "Agility", "Smithing",
  "Defence", "Herblore", "Fishing",
  "Ranged", "Thieving", "Cooking",
  "Prayer", "Crafting", "Firemaking",
  "Magic", "Fletching", "Woodcutting",
  "Runecraft", "Slayer", "Farming",
  "Construction", "Hunter", "Sailing",
];

// In the hiscores "activities" list, everything from this entry onward is a boss.
const FIRST_BOSS = "Abyssal Sire";
const COLLECTION_LOG = "Collections Logged";

const form = document.getElementById("search-form");
const nameInput = document.getElementById("player-name");
const statusText = document.getElementById("status");
const results = document.getElementById("results");
const grid = document.getElementById("skill-grid");
const tabs = document.querySelectorAll(".tabs button");

let currentData = null;

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = nameInput.value.trim();
  if (!name) return;

  statusText.textContent = `Looking up ${name}...`;
  try {
    const data = await fetchHiscores(name);
    statusText.textContent = "";
    showPlayer(name, data);
  } catch (error) {
    statusText.textContent = error.message;
  }
});

document.getElementById("demo-button").addEventListener("click", () => {
  statusText.textContent = "Showing made-up demo data.";
  showPlayer("Demo Player", makeDemoData());
});

tabs.forEach((tab) => {
  tab.addEventListener("click", () => switchView(tab.dataset.view));
});

async function fetchHiscores(name) {
  const response = await fetch(`${PROXY_URL}/?player=${encodeURIComponent(name)}`);
  if (response.status === 404) {
    throw new Error(`No hiscores found for "${name}".`);
  }
  if (!response.ok) {
    throw new Error(`The hiscores didn't respond (status ${response.status}). Try again in a moment.`);
  }
  return response.json();
}

function showPlayer(name, data) {
  currentData = data;
  results.hidden = false;
  document.getElementById("player-title").textContent = name;

  const overall = data.skills.find((s) => s.name === "Overall");
  document.getElementById("overall").textContent = overall
    ? `Total level ${formatNumber(overall.level)} · ${formatNumber(overall.xp)} XP · Rank ${formatRank(overall.rank)}`
    : "";

  buildSkillGrid(data.skills);
  buildScoreLists(data.activities);
  switchView("level");
}

function buildSkillGrid(skills) {
  grid.classList.remove("revealed");
  grid.innerHTML = "";

  SKILL_LAYOUT.forEach((skillName, index) => {
    const skill = skills.find((s) => s.name === skillName);
    if (!skill) return;

    const row = Math.floor(index / 3);
    const col = index % 3;
    const level = Math.max(skill.level, 1);

    const tile = document.createElement("div");
    tile.className = "tile";
    tile.title = skillName;
    tile.dataset.band = level >= 99 ? "max" : Math.floor(level / 10);
    tile.dataset.level = level;
    tile.dataset.rank = skill.rank;
    tile.dataset.xp = Math.max(skill.xp, 0);
    // Tiles on the same diagonal share a delay, which makes the wave.
    tile.style.setProperty("--delay", `calc(var(--wave-step) * ${row + col})`);

    tile.innerHTML = `
      <div class="tile-inner">
        <img class="icon" src="${iconUrl(skillName)}" alt="">
        <img class="big-icon" src="${iconUrl(skillName)}" alt="${skillName} 99">
        <span class="value"></span>
      </div>`;
    grid.appendChild(tile);
  });

  // Wait one frame so the browser draws the grey tiles first, then start the wave.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => grid.classList.add("revealed"));
  });
}

function buildScoreLists(activities) {
  const bossStart = activities.findIndex((a) => a.name === FIRST_BOSS);
  const bosses = bossStart >= 0 ? activities.slice(bossStart) : [];
  const others = (bossStart >= 0 ? activities.slice(0, bossStart) : activities)
    .filter((a) => a.name !== COLLECTION_LOG);

  fillList("boss-list", bosses, "No boss kills on the hiscores yet.");
  fillList("activity-list", others, "No clues or minigames on the hiscores yet.");

  const log = activities.find((a) => a.name === COLLECTION_LOG);
  document.getElementById("collection-summary").innerHTML = log && log.score > 0
    ? `<strong>${formatNumber(log.score)}</strong> items logged<br><span class="rank">Rank ${formatRank(log.rank)}</span>`
    : "Not ranked for collection log yet.";
}

function fillList(listId, entries, emptyMessage) {
  const list = document.getElementById(listId);
  list.innerHTML = "";

  // The hiscores use -1 when a player isn't ranked for something.
  const ranked = entries.filter((e) => e.score > 0);
  if (ranked.length === 0) {
    list.innerHTML = `<li>${emptyMessage}</li>`;
    return;
  }

  ranked.forEach((entry) => {
    const item = document.createElement("li");
    item.innerHTML = `
      <span>${entry.name}</span>
      <span>${formatNumber(entry.score)} <span class="rank">#${formatNumber(entry.rank)}</span></span>`;
    list.appendChild(item);
  });
}

function switchView(view) {
  tabs.forEach((tab) => tab.setAttribute("aria-selected", tab.dataset.view === view));

  const isSkillView = ["level", "rank", "xp"].includes(view);
  document.getElementById("skills-panel").hidden = !isSkillView;
  document.getElementById("bosses-panel").hidden = view !== "bosses";
  document.getElementById("activities-panel").hidden = view !== "activities";
  document.getElementById("collection-panel").hidden = view !== "collection";

  if (!isSkillView) return;

  // Only the text changes. The tile classes stay, so colors and effects carry over.
  grid.dataset.view = view;
  grid.querySelectorAll(".tile").forEach((tile) => {
    const value = tile.querySelector(".value");
    if (view === "level") value.textContent = tile.dataset.level;
    if (view === "rank") value.textContent = formatRank(Number(tile.dataset.rank));
    if (view === "xp") value.textContent = formatNumber(Number(tile.dataset.xp));
  });
}

function iconUrl(skillName) {
  // Skill icons from the OSRS Wiki. Swap these for your own images any time.
  return `https://oldschool.runescape.wiki/images/${skillName}_icon.png`;
}

function formatNumber(n) {
  return Number(n).toLocaleString();
}

function formatRank(rank) {
  return rank > 0 ? formatNumber(rank) : "—";
}

// Random stats in the same shape as the real hiscores JSON, for testing the effects.
function makeDemoData() {
  const skills = SKILL_LAYOUT.map((name) => {
    const level = Math.random() < 0.25 ? 99 : 1 + Math.floor(Math.random() * 98);
    return { name, level, xp: level * level * 1000, rank: 1 + Math.floor(Math.random() * 500000) };
  });
  const total = skills.reduce((sum, s) => sum + s.level, 0);
  const totalXp = skills.reduce((sum, s) => sum + s.xp, 0);
  skills.unshift({ name: "Overall", level: total, xp: totalXp, rank: 123456 });

  const activities = [
    { name: "Clue Scrolls (all)", score: 312, rank: 40211 },
    { name: "Clue Scrolls (elite)", score: 58, rank: 22130 },
    { name: COLLECTION_LOG, score: 642, rank: 51234 },
    { name: FIRST_BOSS, score: 120, rank: 30552 },
    { name: "Vorkath", score: 1450, rank: 8210 },
    { name: "Zulrah", score: 900, rank: 25001 },
  ];
  return { skills, activities };
}
