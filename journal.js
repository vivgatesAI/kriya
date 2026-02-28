const storageKey = "kriya_journal_entries_local";
let entries = [];

const timeline = document.getElementById("timeline");
const search = document.getElementById("search");
const tagFilter = document.getElementById("tagFilter");
const detail = document.getElementById("detailContent");
const totalEntries = document.getElementById("totalEntries");
const streak = document.getElementById("streak");
const hours = document.getElementById("hours");
const range = document.getElementById("range");
const todayLabel = document.getElementById("todayLabel");

todayLabel.textContent = new Date().toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric" }).toUpperCase();

document.getElementById("themeToggle").addEventListener("click", () => document.body.classList.toggle("invert"));

document.getElementById("addEntry").addEventListener("click", () => document.getElementById("entryModal").showModal());

document.getElementById("entryForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const entry = {
    date: f.get("date"),
    title: f.get("title"),
    summary: f.get("summary"),
    items: String(f.get("items") || "").split(",").map(v => v.trim()).filter(Boolean),
    tags: String(f.get("tags") || "").split(",").map(v => v.trim().toLowerCase()).filter(Boolean),
    hours: Number(f.get("hours") || 0),
    source: "manual"
  };
  entries.push(entry);
  entries.sort((a,b) => new Date(b.date) - new Date(a.date));
  persist();
  rebuildTagFilter();
  render();
  e.target.closest("dialog").close();
  e.target.reset();
});

search.addEventListener("input", render);
tagFilter.addEventListener("change", render);
range.addEventListener("input", render);

function persist() {
  localStorage.setItem(storageKey, JSON.stringify(entries));
}

async function loadEntries() {
  const local = JSON.parse(localStorage.getItem(storageKey) || "null") || [];
  try {
    const res = await fetch("./data/entries.json", { cache: "no-store" });
    const remote = await res.json();
    entries = [...remote, ...local];
    const seen = new Set();
    entries = entries.filter(e => {
      const k = `${e.date}|${e.title}|${e.summary}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  } catch {
    entries = local;
  }
  entries.sort((a,b) => new Date(b.date) - new Date(a.date));
}

function rebuildTagFilter() {
  const tags = new Set(entries.flatMap(e => e.tags || []));
  const current = tagFilter.value;
  tagFilter.innerHTML = '<option value="all">ALL</option>' + [...tags].sort().map(t => `<option value="${t}">${t.toUpperCase()}</option>`).join("");
  if ([...tags, "all"].includes(current)) tagFilter.value = current;
}

function computeStats(list) {
  totalEntries.textContent = list.length;
  hours.textContent = list.reduce((a,b) => a + (b.hours || 0), 0).toFixed(1);

  const dates = [...new Set(list.map(e => e.date))].sort((a,b) => new Date(b) - new Date(a));
  let s = 0;
  let d = new Date();
  while (dates.includes(d.toISOString().slice(0,10))) {
    s++; d.setDate(d.getDate() - 1);
  }
  streak.textContent = s;
}

function filtered() {
  const q = search.value.trim().toLowerCase();
  const tag = tagFilter.value;

  let list = [...entries].sort((a,b) => new Date(b.date) - new Date(a.date));
  const cap = Math.max(1, Math.floor((range.value / 100) * list.length));
  list = list.slice(0, cap);

  return list.filter(e => {
    const text = [e.title, e.summary, ...(e.items || []), ...(e.tags || [])].join(" ").toLowerCase();
    const hitQ = !q || text.includes(q);
    const hitTag = tag === "all" || (e.tags || []).includes(tag);
    return hitQ && hitTag;
  });
}

function render() {
  const list = filtered();
  computeStats(list);

  timeline.innerHTML = list.map((e, i) => `
    <li data-i="${i}">
      <div class="date">${e.date.slice(5)}</div>
      <div>
        <div class="card-title">${e.title}</div>
        <div>${e.summary}</div>
        <div class="tags">${(e.tags || []).map(t => `<span class="tag">${t}</span>`).join("")}</div>
      </div>
    </li>
  `).join("");

  [...timeline.querySelectorAll("li")].forEach(li => {
    li.addEventListener("click", () => {
      [...timeline.querySelectorAll("li")].forEach(x => x.classList.remove("active"));
      li.classList.add("active");
      const e = list[Number(li.dataset.i)];
      detail.innerHTML = `
        <div><strong>${e.date}</strong> — ${e.title}</div>
        <div>${e.summary}</div>
        <div><strong>Hours:</strong> ${e.hours || 0}</div>
        <div><strong>Work Items</strong><ul>${(e.items || []).map(i => `<li>${i}</li>`).join("") || "<li>No items listed.</li>"}</ul></div>
      `;
    });
  });

  if (list[0]) timeline.querySelector("li")?.click();
}

loadEntries().then(() => {
  rebuildTagFilter();
  render();
});
