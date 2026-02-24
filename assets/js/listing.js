(async () => {
  const p = new URLSearchParams(location.search);
  const id = (p.get("id") || "").trim();
  if (!id) return;

  const res = await fetch("/data/listings.json", { cache: "no-store" });
  const listings = await res.json();
  const x = listings.find(a => a.id === id);
  if (!x) return;

  document.title = `${x.name}, Lapidary Directory USA`;

  const setText = (sel, val) => {
    const el = document.getElementById(sel);
    if (el) el.textContent = val || "";
  };

  setText("crumbName", x.name);
  setText("name", x.name);
  setText("tagline", x.tagline || "");
  setText("type", x.type || "");
  setText("location", [x.city, x.state].filter(Boolean).join(", "));
  setText("category", x.category || "");
  setText("offerings", (x.offerings || []).join(", "));
  setText("credentials", x.credentials || "None listed");
  setText("serviceArea", x.service_area || "Local");
  setText("priceModel", x.price_model || "Not listed");
  setText("updatedAt", (x.updated_at || "").slice(0, 10));
  setText("address", x.address || "Not listed");
  setText("about", x.about || "No description yet.");

  const phone = document.getElementById("phone");
  if (phone) {
    const v = x.phone || "";
    phone.textContent = v || "Not listed";
    phone.href = v ? `tel:${v.replace(/[^\d+]/g,"")}` : "#";
  }

  const email = document.getElementById("email");
  if (email) {
    const v = x.email || "";
    email.textContent = v || "Not listed";
    email.href = v ? `mailto:${v}` : "#";
  }

  const website = document.getElementById("website");
  if (website) {
    const v = x.website || "";
    website.href = v || "#";
    if (!v) website.classList.add("btn-ghost");
  }

  const directions = document.getElementById("directions");
  if (directions) {
    const query = encodeURIComponent([x.address, x.city, x.state].filter(Boolean).join(", "));
    directions.href = query ? `https://www.google.com/maps/search/?api=1&query=${query}` : "#";
  }

  const related = listings
    .filter(a => a.id !== x.id)
    .filter(a => a.category === x.category || a.state === x.state)
    .slice(0, 6);

  const rel = document.getElementById("related");
  if (rel) {
    rel.innerHTML = related.map(a => {
      const loc = [a.city, a.state].filter(Boolean).join(", ");
      return `
        <article class="card card-item">
          <div class="meta">
            <span class="badge">${a.type}</span>
            <span class="dot">•</span>
            <span>${loc}</span>
          </div>
          <h3><a href="/listing.html?id=${encodeURIComponent(a.id)}">${a.name}</a></h3>
          <p>${escapeHtml((a.tagline || (a.offerings || []).slice(0,3).join(", ") || "").slice(0, 120))}</p>
          <div class="meta">
            <span class="badge">${a.category}</span>
          </div>
        </article>
      `;
    }).join("");
  }

  function escapeHtml(s) {
    return String(s || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();
