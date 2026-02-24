(async () => {
  const isHome = location.pathname === "/" || location.pathname.endsWith("/index.html");
  const isListings = location.pathname.endsWith("/listings.html");
  const isListing = location.pathname.endsWith("/listing.html");

  const add = (obj) => {
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(obj);
    document.head.appendChild(s);
  };

  if (isHome) {
    add({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Lapidary Directory",
      "url": "https://lapidarydirectory.com/",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://lapidarydirectory.com/listings.html?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    });
  }

  if (isListings) {
    add({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Lapidary Listings",
      "url": "https://lapidarydirectory.com/listings.html"
    });
  }

  if (isListing) {
    const p = new URLSearchParams(location.search);
    const id = (p.get("id") || "").trim();
    if (!id) return;

    const res = await fetch("/data/listings.json", { cache: "no-store" });
    const listings = await res.json();
    const x = listings.find(a => a.id === id);
    if (!x) return;

    const loc = [x.address, x.city, x.state].filter(Boolean).join(", ");

    add({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": x.name,
      "url": x.website || `https://lapidarydirectory.com/listing.html?id=${encodeURIComponent(x.id)}`,
      "telephone": x.phone || "",
      "email": x.email || "",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": x.address || "",
        "addressLocality": x.city || "",
        "addressRegion": x.state || "",
        "addressCountry": "US"
      },
      "areaServed": x.service_area || "US",
      "description": x.tagline || x.about || "",
      "keywords": [x.category, (x.offerings || []).join(", ")].filter(Boolean).join(", "),
      "sameAs": x.website ? [x.website] : []
    });

    if (loc) {
      add({
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": x.name,
        "url": `https://lapidarydirectory.com/listing.html?id=${encodeURIComponent(x.id)}`
      });
    }
  }
})();
