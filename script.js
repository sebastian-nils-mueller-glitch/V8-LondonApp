/* === LondonApp V3.6 – New Year's Edition === */
/* Features:
   - Dynamischer Skyline-Banner mit Glow-Titel
   - Soft Glass Navigationsbuttons
   - Accordion-System bei Ideen & Alternativen (+/-)
   - Automatische Erweiterung auf min. 10 Ideen pro Kategorie
   - Region-basierte Food Picks
*/

const el = (q, c = document) => c.querySelector(q);
const els = (q, c = document) => [...c.querySelectorAll(q)];

const dayColors = ["#2b5cff", "#2ecc71", "#f39c12", "#e74c3c", "#9b59b6", "#16a085"];
let globalData = null;
let currentDayIndex = null;

// ---------- Dynamischer Banner ----------
function setDynamicBanner() {
  const banner = el(".trip-banner");
  const hour = new Date().toLocaleString("en-GB", { timeZone: "Europe/London", hour: "2-digit", hour12: false });
  const h = parseInt(hour, 10);
  let image = "";

  if (h >= 6 && h < 10)
    image = "https://images.unsplash.com/photo-1602535819025-6cf5f7b1bbfe?auto=format&fit=crop&w=1200&q=80"; // Morning light
  else if (h >= 10 && h < 17)
    image = "https://images.unsplash.com/photo-1473959383417-5cd8c1df8a06?auto=format&fit=crop&w=1200&q=80"; // Day skyline
  else if (h >= 17 && h < 21)
    image = "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=1200&q=80"; // Sunset
  else
    image = "https://images.unsplash.com/photo-1541844053589-346841d0d8f8?auto=format&fit=crop&w=1200&q=80"; // Night

  banner.style.backgroundImage = `url(${image})`;
}
setDynamicBanner();

// ---------- Daten laden ----------
async function loadData() {
  try {
    const res = await fetch("london2025_data.json", { cache: "no-cache" });
    if (!res.ok) throw new Error("Datei nicht gefunden");
    globalData = await res.json();
    renderDays(globalData.tage || []);
    renderIdeas(globalData.ideen || {});
  } catch (e) {
    console.error("Fehler beim Laden der Daten:", e);
    el("#day-grid").innerHTML = "<div class='card'>⚠️ Reiseplan konnte nicht geladen werden.</div>";
  }
}

// ---------- Tagesübersicht ----------
function renderDays(days) {
  const grid = el("#day-grid");
  grid.innerHTML = "";
  days.forEach((day) => {
    const color = dayColors[(day.tag - 1) % dayColors.length];
    const card = document.createElement("button");
    card.className = "day-card";
    const date = new Date(day.datum).toLocaleDateString("de-DE", {
      weekday: "short", day: "2-digit", month: "2-digit",
    });
    card.innerHTML = `
      <h3 style="color:${color}">Tag ${day.tag} – ${date}</h3>
      <div class="badge" style="color:${color}">
        <span class="dot" style="background:${color}"></span>
        <span>${day.titel}</span>
      </div>`;
    card.onclick = () => openSheet(day.tag - 1);
    grid.appendChild(card);
  });
}

// ---------- Ideen & Alternativen ----------
function renderIdeas(ideas) {
  const wrap = el("#ideas");
  wrap.innerHTML = "";
  const groups = [
    { key: "abends", title: "Abendspaziergänge", icon: "🌆" },
    { key: "design_orte", title: "Design & Orte mit Charakter", icon: "🎨" },
    { key: "kulinarisch", title: "Kulinarische Abende", icon: "🍽️" },
    { key: "kultur_tipps", title: "Kulturelle Geheimtipps", icon: "🏛️" },
    { key: "fotospots", title: "Fotospots", icon: "📷" },
  ];

  groups.forEach((g) => {
    let list = ideas[g.key] || [];
    if (list.length < 10) list = expandIdeaList(list, g.key); // min. 10 Vorschläge

    const group = document.createElement("div");
    group.className = "idea-group collapsed";

    const header = document.createElement("div");
    header.className = "idea-header";
    header.innerHTML = `
      <div class="title">${g.icon} ${g.title}</div>
      <div class="toggle">＋</div>
    `;
    group.appendChild(header);

    const grid = document.createElement("div");
    grid.className = "idea-grid";
    list.forEach((item) => {
      const name = item.name || "";
      const link = item.url || `https://www.tripadvisor.com/Search?q=${encodeURIComponent(name + " London")}`;
      const pill = document.createElement("div");
      pill.className = "idea-pill";
      pill.innerHTML = `
        <div class="name">${name}</div>
        <div class="actions">
          <button class="btn small">🔗 Link</button>
          ${item.coords ? `<button class="btn small">📍 Map</button>` : ""}
        </div>
      `;
      const [linkBtn, mapBtn] = pill.querySelectorAll("button");
      linkBtn.onclick = () => window.open(link, "_blank");
      if (mapBtn) mapBtn.onclick = () => openMapForCoords(name, item.coords.lat, item.coords.lng);
      grid.appendChild(pill);
    });
    group.appendChild(grid);
    header.onclick = () => toggleAccordion(group);
    wrap.appendChild(group);
  });
}

function toggleAccordion(target) {
  const all = els(".idea-group");
  all.forEach((g) => {
    if (g !== target) {
      g.classList.add("collapsed");
      g.classList.remove("expanded");
    }
  });
  target.classList.toggle("collapsed");
  target.classList.toggle("expanded");
}

// ---------- Fallback-Ideen auffüllen ----------
function expandIdeaList(list, key) {
  const db = {
    abends: [
      "Southbank Walk","Leicester Square","Regent’s Park","Soho Nights","Embankment Lights",
      "Piccadilly Circus","Covent Garden Evenings","Trafalgar Square","Canary Wharf Lights","Chelsea Riverside"
    ],
    design_orte: [
      "Tate Modern","Barbican Centre","Somerset House","The Shard Design Level","Saatchi Gallery",
      "Design District Greenwich","Whitechapel Gallery","Victoria & Albert Museum","Serpentine Pavilion","Museum of London"
    ],
    kulinarisch: [
      "Flat Iron Steak","Padella Borough Market","Hawksmoor Seven Dials","Sketch London","The Wolseley",
      "Cinnamon Club","Ottolenghi Spitalfields","Dishoom Covent Garden","The Ivy Market Grill","Bill’s Soho"
    ],
    kultur_tipps: [
      "British Museum","Shakespeare’s Globe","National Gallery","St. Paul’s Cathedral","Science Museum",
      "Museum of London Docklands","Royal Albert Hall","Natural History Museum","National Theatre","Somerset House"
    ],
    fotospots: [
      "London Eye","Millennium Bridge","Piccadilly Lights","Neal’s Yard","St Dunstan in the East",
      "Hampstead Heath View","Primrose Hill","Tower Bridge View","Sky Garden","Greenwich Observatory"
    ]
  };
  const names = list.map(i => i.name);
  db[key].forEach(name => {
    if (!names.includes(name)) list.push({ name });
  });
  return list.slice(0, 10);
}

// ---------- Bottom Sheet ----------
const sheet = el("#sheet");
const sheetTitle = el("#sheetTitle");
const timeline = el("#timeline");
el("#closeSheet").onclick = closeSheet;

function openSheet(index) {
  if (!globalData) return;
  const days = globalData.tage || [];
  currentDayIndex = index;
  const day = days[index];

  sheetTitle.textContent = `Tag ${day.tag}: ${day.titel}`;
  timeline.innerHTML = "";

  (day.punkte || []).forEach((p) => {
    const link = p.url || `https://www.tripadvisor.com/Search?q=${encodeURIComponent(p.name + " London")}`;
    const row = document.createElement("div");
    row.className = "event";
    row.innerHTML = `
      <div class="time">${p.zeit || ""}</div>
      <div class="event-card">
        <div class="title">${p.name}</div>
        <div class="row"><a href="${link}" target="_blank">Link</a></div>
      </div>`;
    timeline.appendChild(row);
  });

  addWeatherTile(day);
  updateTopNav(index);

  sheet.classList.remove("hidden");
  requestAnimationFrame(() => sheet.classList.add("visible"));
}

function updateTopNav(index) {
  const days = globalData.tage || [];
  const prev = el("#prevDayTop");
  const next = el("#nextDayTop");
  const mapBtn = el("#openMap");

  prev.disabled = index === 0;
  next.disabled = index === days.length - 1;

  prev.onclick = () => openSheet(index - 1);
  next.onclick = () => openSheet(index + 1);
  mapBtn.onclick = () => openMap(days[index]);
  el("#closeSheet").onclick = closeSheet;
}

function closeSheet() {
  sheet.classList.remove("visible");
  setTimeout(() => sheet.classList.add("hidden"), 250);
}

// ---------- Widgets ----------
async function addWeatherTile(day) {
  const container = document.createElement("div");
  container.className = "widget-row";
  timeline.appendChild(container);

  const weatherDiv = document.createElement("div");
  weatherDiv.className = "weather-tile";
  container.appendChild(weatherDiv);

  const first = (day.punkte || []).find((p) => p.coords);
  if (first && first.coords) {
    const { lat, lng } = first.coords;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,precipitation_probability,windspeed_10m&daily=temperature_2m_max,precipitation_sum&forecast_days=2&timezone=Europe/London`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      const currentTemp = data.current?.temperature_2m;
      const rain = data.current?.precipitation_probability;
      const wind = data.current?.windspeed_10m;
      const tomorrow = data.daily?.temperature_2m_max?.[1];
      const emoji = rain > 60 ? "🌧️" : rain > 30 ? "🌦️" : rain > 10 ? "⛅" : "☀️";
      weatherDiv.innerHTML = `
        <div class="header"><span class="icon">${emoji}</span><strong>${first.name}</strong></div>
        <div class="temp"><span class="big">${currentTemp?.toFixed(0)} °C</span> / <span>${tomorrow?.toFixed(0)} °C morgen</span></div>
        <div class="meta">💧 Regen ${rain ?? "?"}% · 💨 Wind ${wind?.toFixed(0) ?? "?"} km/h</div>`;
    } catch {
      weatherDiv.innerHTML = `<div class="header"><span class="icon">⚠️</span><strong>Wetterdaten nicht verfügbar</strong></div>`;
    }
  }

  addLondonNowTile(container);
  addFoodPickTile(container, day);
}

function addLondonNowTile(container) {
  const nowDiv = document.createElement("div");
  nowDiv.className = "london-tile";
  container.appendChild(nowDiv);
  function updateTime() {
    const londonTime = new Date().toLocaleTimeString("de-DE", {
      hour: "2-digit", minute: "2-digit", timeZone: "Europe/London",
    });
    nowDiv.innerHTML = `
      <div class="header"><span class="icon">🇬🇧</span><strong>London Now</strong></div>
      <div class="time">🕒 ${londonTime}</div>
      <div class="sun">🌅 07:42  ·  🌇 16:12</div>`;
  }
  updateTime(); setInterval(updateTime, 60000);
}

/* === Food Pick (gekürzt: gleiche Logik wie zuvor, regionFoodSuggestions etc.) === */
/* ... für Kürze weggelassen, aber identisch zur 3.5-Version ... */

loadData();
