/* === LondonApp V3.5 – Top-Buttons + Ideas-Grid + Food-Fallback === */

const el = (q, c = document) => c.querySelector(q);
const els = (q, c = document) => [...c.querySelectorAll(q)];

const dayColors = ["#2b5cff", "#2ecc71", "#f39c12", "#e74c3c", "#9b59b6", "#16a085"];
let globalData = null;
let currentDayIndex = null;

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

// ---------- Ideen & Alternativen (Variante C mit Buttons) ----------
function renderIdeas(ideas) {
  const wrap = el("#ideas");
  wrap.innerHTML = "";
  wrap.classList.add("ideas-section");

  const groups = [
    { key: "abends", title: "Abendspaziergänge", icon: "🌆" },
    { key: "design_orte", title: "Design & Orte mit Charakter", icon: "🎨" },
    { key: "kulinarisch", title: "Kulinarische Abende", icon: "🍽️" },
    { key: "kultur_tipps", title: "Kulturelle Geheimtipps", icon: "🏛️" },
    { key: "fotospots", title: "Fotospots", icon: "📷" },
  ];

  for (const g of groups) {
    const list = ideas[g.key] || [];
    const box = document.createElement("div");
    box.className = "idea-group";
    box.innerHTML = `<h4>${g.icon} ${g.title}</h4>`;

    const grid = document.createElement("div");
    grid.className = "idea-grid";

    list.forEach((item) => {
      const name = item.name || "";
      const link = item.url || `https://www.tripadvisor.com/Search?q=${encodeURIComponent(name + " London")}`;

      const pill = document.createElement("div");
      pill.className = "idea-pill";

      const left = document.createElement("div");
      left.className = "name";
      left.textContent = name;

      const right = document.createElement("div");
      right.className = "actions";

      const linkBtn = document.createElement("button");
      linkBtn.className = "btn ghost small";
      linkBtn.textContent = "🔗 Link";
      linkBtn.onclick = () => window.open(link, "_blank");

      right.appendChild(linkBtn);

      if (item.coords && item.coords.lat && item.coords.lng) {
        const mapBtn = document.createElement("button");
        mapBtn.className = "btn ghost small";
        mapBtn.textContent = "📍 Map";
        mapBtn.onclick = () => openMapForCoords(name, item.coords.lat, item.coords.lng);
        right.appendChild(mapBtn);
      }

      pill.appendChild(left);
      pill.appendChild(right);
      grid.appendChild(pill);
    });

    box.appendChild(grid);
    wrap.appendChild(box);
  }
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

  // Widgets & Top-Buttons
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

  // Wetter
  const weatherDiv = document.createElement("div");
  weatherDiv.className = "weather-tile";
  weatherDiv.innerHTML = `<div class="header"><span class="icon">🌦️</span><strong>Wetter wird geladen...</strong></div>`;
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
        <div class="meta">💧 Regen ${rain ?? "?"}% · 💨 Wind ${wind?.toFixed(0) ?? "?"} km/h</div>
        <div class="meta2"><em>Feels like London — cool & breezy near the Thames</em></div>`;
    } catch {
      weatherDiv.innerHTML = `<div class="header"><span class="icon">⚠️</span><strong>Wetterdaten nicht verfügbar</strong></div>`;
    }
  }

  // London Now
  addLondonNowTile(container);

  // Food Picks (mit Fallbacks)
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
      <div class="sun">🌅 07:42  ·  🌇 16:12</div>
      <div class="meta">+1 h to Germany</div>`;
  }
  updateTime();
  setInterval(updateTime, 60000);
}

/* Erweiterte Food-Pick-Logik mit Regionen-Erkennung */
function addFoodPickTile(container, day) {
  const foodDiv = document.createElement("div");
  foodDiv.className = "food-tile";
  container.appendChild(foodDiv);

  const foodPlaces = (day.punkte || []).filter((p) =>
    /dinner|essen|restaurant|food/i.test(p.name || "")
  );

  if (foodPlaces.length < 2) {
    const region = detectRegion(day);
    const fallback = regionFoodSuggestions(region);
    fallback.forEach((f) => foodPlaces.push(f));
  }

  if (!foodPlaces.length) {
    foodDiv.innerHTML = `
      <div class="header"><span class="icon">🍴</span><strong>Food Picks</strong></div>
      <div class="meta">Keine Dinner-Ideen für heute.</div>`;
    return;
  }

  const picks = foodPlaces.slice(0, 3);
  foodDiv.innerHTML = `<div class="header"><span class="icon">🍴</span><strong>Food Picks</strong></div>`;
  picks.forEach((pick) => {
    const link = pick.url || `https://www.tripadvisor.com/Search?q=${encodeURIComponent(pick.name + " London")}`;
    const elPick = document.createElement("div");
    elPick.className = "place";
    elPick.innerHTML = `<a href="${link}" target="_blank">${pick.name}</a>`;
    foodDiv.appendChild(elPick);
  });
}

function detectRegion(day) {
  const title = (day.titel || "").toLowerCase();
  const firstName = (day.punkte?.[0]?.name || "").toLowerCase();

  if (/greenwich|cutty|boat|canary/.test(title + firstName)) return "greenwich";
  if (/camden|primrose/.test(title + firstName)) return "camden";
  if (/shoreditch|spitalfields|brick/.test(title + firstName)) return "shoreditch";
  if (/kew|richmond/.test(title + firstName)) return "kew";
  if (/hyde|kensington|chelsea|v&a|south ken/.test(title + firstName)) return "kensington";
  if (/tower|aldgate|city|bishopsgate|bank/.test(title + firstName)) return "city";
  if (/battersea|clapham|nine elms/.test(title + firstName)) return "battersea";
  return "central";
}

function regionFoodSuggestions(region) {
  const db = {
    shoreditch: [
      { name: "Dishoom Shoreditch", url: "https://www.dishoom.com/shoreditch/" },
      { name: "Smokestak BBQ", url: "https://www.smokestak.co.uk/" },
      { name: "Brat Restaurant", url: "https://www.bratrestaurant.com/" },
    ],
    greenwich: [
      { name: "Heap’s Sausages Greenwich", url: "https://www.heapssausages.co.uk/" },
      { name: "The Gipsy Moth", url: "https://www.thegipsymothgreenwich.co.uk/" },
      { name: "Sticks'n'Sushi Greenwich", url: "https://sticksnsushi.com/en" },
    ],
    camden: [
      { name: "Poppies Fish & Chips Camden", url: "https://poppiesfishandchips.co.uk/" },
      { name: "Mildreds Camden", url: "https://www.mildreds.co.uk/" },
      { name: "The Cheese Bar Camden", url: "https://thecheesebar.com/" },
    ],
    kew: [
      { name: "The Glasshouse Kew", url: "https://www.glasshouserestaurant.co.uk/" },
      { name: "Tap on the Line", url: "https://www.greeneking-pubs.co.uk/" },
      { name: "The Botanist Kew", url: "https://www.thebotanistkew.co.uk/" },
    ],
    kensington: [
      { name: "The Ivy Kensington Brasserie", url: "https://theivycollection.com/" },
      { name: "Ceru South Kensington", url: "https://www.ceru.restaurant/" },
      { name: "Comptoir Libanais", url: "https://www.comptoirlibanais.com/" },
    ],
    city: [
      { name: "Duck & Waffle", url: "https://duckandwaffle.com/" },
      { name: "Sky Garden Fenchurch", url: "https://skygarden.london/" },
      { name: "Hawksmoor Guildhall", url: "https://www.hawksmoor.com/" },
    ],
    battersea: [
      { name: "Tozi Grand Cafe", url: "https://www.tozigrandcafe.com/" },
      { name: "Gordon Ramsay Street Pizza Battersea", url: "https://www.gordonramsayrestaurants.com/" },
      { name: "Brindisa Battersea", url: "https://www.brindisakitchens.com/" },
    ],
    central: [
      { name: "Sketch Mayfair", url: "https://sketch.london/" },
      { name: "The Wolseley", url: "https://www.thewolseley.com/" },
      { name: "Dishoom Covent Garden", url: "https://www.dishoom.com/covent-garden/" },
    ],
  };
  return db[region] || db.central;
}

// ---------- Karte ----------
let map, layer;
const mapModal = el("#mapModal");
const mapHint = el("#mapHint");
el("#closeMap").onclick = closeMap;

function openMap(day) {
  openMapBase();
  drawDayOnMap(day);
}

function openMapForCoords(name, lat, lng) {
  openMapBase();
  if (layer) layer.remove();
  layer = L.layerGroup().addTo(map);

  const m = L.marker([lat, lng]).addTo(layer);
  m.bindPopup(`<strong>${name}</strong>`).openPopup();
  map.setView([lat, lng], 15);
}

function openMapBase() {
  mapModal.classList.remove("hidden");
  requestAnimationFrame(() => mapModal.classList.add("visible"));
  showMapHint();

  if (!map) {
    map = L.map("map", { doubleClickZoom: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: "&copy; OpenStreetMap",
    }).addTo(map);
    map.on("dblclick", closeMap);
  }
}

function drawDayOnMap(day) {
  if (layer) layer.remove();
  layer = L.layerGroup().addTo(map);
  const color = dayColors[(day.tag - 1) % dayColors.length];
  const latlngs = [];

  (day.punkte || []).forEach((p, i) => {
    if (p.coords) {
      const num = i + 1;
      const icon = L.divIcon({
        html: `<div style="background:${color};color:#fff;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:.8rem">${num}</div>`,
        className: "number-icon",
      });
      const m = L.marker([p.coords.lat, p.coords.lng], { icon }).addTo(layer);
      m.bindPopup(`<strong>${num}. ${p.name}</strong><br/>${p.zeit || ""}`);
      latlngs.push([p.coords.lat, p.coords.lng]);
    }
  });

  if (latlngs.length > 1) L.polyline(latlngs, { color, weight: 3, opacity: 0.7 }).addTo(layer);
  if (latlngs.length) map.fitBounds(L.latLngBounds(latlngs).pad(0.2));
  setTimeout(() => map.invalidateSize(), 100);
}

function closeMap() {
  mapModal.classList.remove("visible");
  setTimeout(() => mapModal.classList.add("hidden"), 250);
}
function showMapHint() {
  mapHint.classList.add("visible");
  setTimeout(() => mapHint.classList.remove("visible"), 3000);
}

loadData();
