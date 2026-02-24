(function () {
  const els = {
    form: document.getElementById("filtersForm"),
    q: document.getElementById("q"),
    category: document.getElementById("category"),
    state: document.getElementById("state"),
    type: document.getElementById("type"),
    sort: document.getElementById("sort"),
    cards: document.getElementById("cards"),
    count: document.getElementById("resultsCount"),
    page: document.getElementById("pageLabel"),
    prev: document.getElementById("prevPage"),
    next: document.getElementById("nextPage"),
    reset: document.getElementById("resetBtn"),
  };

  if (!els.cards) return;

  const PAGE_SIZE = 18;
  let all = [];
  let categories = [];
  let states = [];
  let filtered = [];
  let pageIndex = 0;

  function getParams() {
    const p = new URLSearchParams(location.search);
    return {
      q: (p.get("q") || "").trim(),
      category: (p.get("category") || "").trim(),
      state: (p.get("state") || "").trim().toUpperCase(),
      type: (p.get("type") || "").trim(),
      sort: (p.get("sort") || "relevance").trim()
    };
  }

  function setParams(next) {
    const p = new URLSearchParams();
    if (next.q) p.set("q", next.q);
    if (next.category) p.set("category", next.category);
    if (next.state) p.set("state", next.state);
    if (next.type) p.set("type", next.type);
    if (next.sort && next.sort !== "relevance") p.set("sort", next.sort);
    const url = `${location.pathname}?${p.toString()}`;
    history.replaceState({}, "", url);
  }

  function norm(s) {
    return String(s || "").toLowerCase();
  }

  function scoreMatch(item, q) {
    if (!q) return 0;
    const t = [
      item.name,
      item.city,
      item.state,
      item.category,
      (item.offerings || []).join(" "),
      item.tagline,
      item.about
    ].map(norm).join(" | ");
    const parts = q.split(/\s+/).filter(Boolean);
    let score = 0;
    for (const part of parts) {
      if (t.includes(part)) score += 10;
    }
    if (norm(item.name).includes(q)) score += 30;
    return score;
  }

  function applyFilters() {
    const p = {
      q: (els.q?.value || "").trim(),
      category: (els.category?.value || "").trim(),
      state: (els.state?.value || "").trim().toUpperCase(),
      type: (els.type?.value || "").trim(),
      sort: (els.sort?.value || "relevance").trim()
    };

    setParams(p);

    const qn = norm(p.q);
    const cat = p.category;
    const st = p.state;
    const tp = p.type;

    filtered = all
      .filter(x => !cat || x.category === cat)
      .filter(x => !st || (x.state || "").toUpperCase() === st)
      .filter(x => !tp || x.type === tp)
      .map(x => ({ x, s: scoreMatch(x, qn) }))
      .filter(o => !qn || o.s > 0)
      .sort((a,b) => {
        if (p.sort === "name_asc") return a.x.name.localeCompare(b.x.name);
        if (p.sort === "state_city") {
          const as = (a.x.state || "").localeCompare(b.x.state || "");
          if (as !== 0) return as;
          return (a.x.city || "").localeCompare(b.x.city || "");
        }
        if (p.sort === "updated_desc") return String(b.x.updated_at || "").localeCompare(String(a.x.updated_at || ""));
        return b.s - a.s;
      })
      .map(o => o.x);

    pageIndex = 0;
    render();
  }

  function fmtLocation(x) {
    const parts = [];
    if (x.city) parts.push(x.city);
    if (x.state) parts.push(x.state);
    return parts.join(", ");
  }

  function toListingHref(x) {
    return `/listing.html?id=${encodeURIComponent(x.id)}`;
  }

  function cardHtml(x) {
    const loc = fmtLocation(x);
    const offer = (x.offerings || []).slice(0, 3).join(", ");
    const desc = x.tagline || offer || x.about || "";
    const safeDesc = String(desc).slice(0, 140);
    return `
      <article class="card card-item">
        <div class="meta">
          <span class="badge">${x.type}</span>
          <span class="dot">•</span>
          <span>${loc || "United States"}</span>
        </div>
        <h3><a href="${toListingHref(x)}">${x.name}</a></h3>
        <p>${escapeHtml(safeDesc)}</p>
        <div class="meta">
          <span class="badge">${x.category}</span>
          <span class="dot">•</span>
          <a class="fine" href="/listings.html?state=${encodeURIComponent((x.state || "").toUpperCase())}">${(x.state || "").toUpperCase()}</a>
        </div>
      </article>
    `;
  }

  function escapeHtml(s) {
    return String(s || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function render() {
    const total = filtered.length;
    const start = pageIndex * PAGE_SIZE;
    const end = Math.min(start + PAGE_SIZE, total);
    const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

    els.count.textContent = `${total} results`;
    els.page.textContent = `Page ${pageIndex + 1} of ${pageCount}`;

    els.prev.disabled = pageIndex === 0;
    els.next.disabled = pageIndex >= pageCount - 1;

    const slice = filtered.slice(start, end);
    els.cards.innerHTML = slice.map(cardHtml).join("");
  }

  function fillSelects() {
    if (els.category) {
      const opts = categories
        .slice()
        .sort((a,b) => a.name.localeCompare(b.name))
        .map(c => `<option value="${c.slug}">${c.name}</option>`)
        .join("");
      els.category.insertAdjacentHTML("beforeend", opts);
    }

    if (els.state) {
      const opts = states
        .slice()
        .sort((a,b) => a.name.localeCompare(b.name))
        .map(s => `<option value="${s.code}">${s.name}</option>`)
        .join("");
      els.state.insertAdjacentHTML("beforeend", opts);
    }
  }

  function applyParamsToForm() {
    const p = getParams();
    if (els.q) els.q.value = p.q;
    if (els.category) els.category.value = p.category;
    if (els.state) els.state.value = p.state;
    if (els.type) els.type.value = p.type;
    if (els.sort) els.sort.value = p.sort;
  }

  function bind() {
    els.form?.addEventListener("submit", (e) => {
      e.preventDefault();
      applyFilters();
    });

    els.reset?.addEventListener("click", () => {
      if (els.q) els.q.value = "";
      if (els.category) els.category.value = "";
      if (els.state) els.state.value = "";
      if (els.type) els.type.value = "";
      if (els.sort) els.sort.value = "relevance";
      applyFilters();
    });

    els.prev?.addEventListener("click", () => {
      pageIndex = Math.max(0, pageIndex - 1);
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    els.next?.addEventListener("click", () => {
      const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
      pageIndex = Math.min(pageCount - 1, pageIndex + 1);
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  async function init() {
    const [listRes, catRes, stateRes] = await Promise.all([
      fetch("/data/listings.json", { cache: "no-store" }),
      fetch("/data/categories.json", { cache: "no-store" }),
      fetch("/data/states.json", { cache: "no-store" })
    ]);

    all = await listRes.json();
    categories = await catRes.json();
    states = await stateRes.json();

    fillSelects();
    applyParamsToForm();
    bind();
    applyFilters();
  }

  init().catch(() => {});
})();
