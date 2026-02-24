(async () => {
  const metrics = document.getElementById("metrics");
  if (!metrics) return;

  const [listRes, catRes, stateRes] = await Promise.all([
    fetch("/data/listings.json", { cache: "no-store" }),
    fetch("/data/categories.json", { cache: "no-store" }),
    fetch("/data/states.json", { cache: "no-store" })
  ]);

  const listings = await listRes.json();
  const categories = await catRes.json();
  const states = await stateRes.json();

  document.getElementById("mListings").textContent = String(listings.length);
  document.getElementById("mCategories").textContent = String(categories.length);

  const usedStates = new Set(listings.map(x => (x.state || "").toUpperCase()).filter(Boolean));
  document.getElementById("mStates").textContent = String(usedStates.size);

  const popularCategories = document.getElementById("popularCategories");
  const popularStates = document.getElementById("popularStates");

  const catCounts = new Map();
  for (const x of listings) {
    const k = x.category || "";
    if (!k) continue;
    catCounts.set(k, (catCounts.get(k) || 0) + 1);
  }

  const stateCounts = new Map();
  for (const x of listings) {
    const k = (x.state || "").toUpperCase();
    if (!k) continue;
    stateCounts.set(k, (stateCounts.get(k) || 0) + 1);
  }

  const topCats = [...catCounts.entries()].sort((a,b) => b[1]-a[1]).slice(0,8);
  const topStates = [...stateCounts.entries()].sort((a,b) => b[1]-a[1]).slice(0,8);

  const catNameBySlug = new Map(categories.map(c => [c.slug, c.name]));
  const stateNameByCode = new Map(states.map(s => [s.code, s.name]));

  popularCategories.innerHTML = topCats.map(([slug,count]) => {
    const name = catNameBySlug.get(slug) || slug;
    const href = `/listings.html?category=${encodeURIComponent(slug)}`;
    return `<li><a href="${href}">${name} (${count})</a></li>`;
  }).join("");

  popularStates.innerHTML = topStates.map(([code,count]) => {
    const name = stateNameByCode.get(code) || code;
    const href = `/listings.html?state=${encodeURIComponent(code)}`;
    return `<li><a href="${href}">${name} (${count})</a></li>`;
  }).join("");
})();
