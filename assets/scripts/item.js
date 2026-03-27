const params = new URLSearchParams(window.location.search);
const id = params.get("id");

fetch("../football/football_collection.json")
  .then(res => res.json())
  .then(data => {

    const item = data.find(i => i.ID && i.ID.trim() === id.trim());

    if (!item) {
      document.body.innerHTML = "<p>Item not found</p>";
      return;
    }

    // ===== Breadcrumbs =====
    const breadcrumbs = document.getElementById("breadcrumbs");

    function valid(value) {
      return value && value.trim() !== "-" && value.trim() !== "";
    }

    function getValues(key) {
      const value = item[key];

      if (!valid(value)) return [];

      // 🔥 soporta valores múltiples tipo "A/B"
      if (key === "Team" || key === "Person") {
        return value.split("/").map(v => v.trim());
      }

      return [value];
    }

    function buildQuery(params) {
      const search = new URLSearchParams(params);
      return `?${search.toString()}`;
    }

    function link(label, params) {
      return `<a href="./index.html${buildQuery(params)}">${label}</a>`;
    }

    // 🔥 CONFIG CENTRAL
    const breadcrumbConfig = {
      "National Team": ["Entity", "Season", "Team"],
      "Collective": ["Entity", "Season", "Team"],
      "Club": ["Country", "Season", "Team"],
      "Event": ["Competition", "Season", "Team"],
      "Brand": ["Brand", "Season"],
      "Person": ["Team", "Season", "Person"]
    };

    const entity = item["Entity"];
    const config = breadcrumbConfig[entity] || ["Entity", "Season", "Team"];

    let parts = [];

    // Home
    parts.push(`<a href="./index.html">Home</a>`);

    // 🔥 acumulador de params
    let currentParams = {};

    config.forEach(key => {

      const values = getValues(key);

      values.forEach((value, index) => {

        // 🔥 evitar duplicar params en múltiples teams
        const paramKey = key.toLowerCase();

        currentParams[paramKey] = value;

        parts.push(link(value, currentParams));

      });

    });

    // ===== Style (último sin link) =====
    if (valid(item["Style"])) {
      parts.push(`<span>${item["Style"]}</span>`);
    }

    // Render
    breadcrumbs.innerHTML = parts.join(` <span class="breadcrumb-separator">></span> `);

    // ===== Title =====
    document.getElementById("title").textContent = item["Display Name"];
    document.title = item["Display Name"];
    // ===== Images =====
    const gallery = document.getElementById("gallery");

    const basePath = "../assets/images/";
    const images = ["ph_front.jpg", "ph_back.jpg", "ph_box.jpg"];

    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightbox-img");
    const closeBtn = document.getElementById("close");
    const prevBtn = document.getElementById("prev");
    const nextBtn = document.getElementById("next");

    let currentIndex = 0;

    const mainImg = document.createElement("img");
    mainImg.id = "main-image";
    gallery.appendChild(mainImg);

    const thumbnails = document.createElement("div");
    thumbnails.id = "thumbnails";
    gallery.appendChild(thumbnails);

    images.forEach((name, index) => {
      const thumb = document.createElement("img");
      thumb.src = basePath + name;
      thumb.alt = item["Display Name"];
      thumb.loading = "lazy";

      thumb.addEventListener("click", () => {
        currentIndex = index;
        updateMainImage();
      });

      thumbnails.appendChild(thumb);
    });

    function updateMainImage() {
      mainImg.src = basePath + images[currentIndex];

      document.querySelectorAll("#thumbnails img").forEach((img, i) => {
        img.classList.toggle("active", i === currentIndex);
      });
    }

    mainImg.addEventListener("click", openLightbox);

    function openLightbox() {
      lightbox.classList.add("active");
      updateLightbox();
    }

    function closeLightbox() {
      lightbox.classList.remove("active");
    }

    function updateLightbox() {
      lightboxImg.src = basePath + images[currentIndex];
    }

    function showPrev() {
      currentIndex = (currentIndex - 1 + images.length) % images.length;
      updateMainImage();
      updateLightbox();
    }

    function showNext() {
      currentIndex = (currentIndex + 1) % images.length;
      updateMainImage();
      updateLightbox();
    }

    closeBtn.onclick = closeLightbox;
    prevBtn.onclick = showPrev;
    nextBtn.onclick = showNext;

    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener("keydown", (e) => {
      if (!lightbox.classList.contains("active")) return;

      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    });

    updateMainImage();

    // ===== Details =====
    const details = document.getElementById("details");

    const hasNameset = item["Nameset"] && item["Nameset"].trim() !== "-" && item["Nameset"].trim() !== "";
    const hasSleeves = item["Sleeves"] && item["Sleeves"].trim() !== "-" && item["Sleeves"].trim() !== "" && item["Sleeves"].trim() !== "Short";
    const hasCollaboration = item["Collaboration"] && item["Collaboration"].trim() !== "-" && item["Collaboration"].trim() !== "";
    const hasRelease = item["Release"] && item["Release"].trim() !== "-" && item["Release"].trim() !== "" && item["Release"].trim() !== "Regular";
    Object.entries(item).forEach(([key, value]) => {

      if (
        key === "ID" ||
        key === "Display Name" ||
        key === "Variant" ||
        key === "Category" ||
        key === "Entity" ||
        key === "Nameset" ||
        key === "Sleeves" ||
        key === "Collaboration" ||
        (key === "Release" && !hasRelease)
      ) return;

      if (!value || value.trim() === "-" || value.trim() === "") return;

      let finalValue = value;

      if (key === "Print") {
        if (hasNameset) finalValue += ` (${item["Nameset"]} Nameset)`;
      }

      if (key === "Style") {
        if (hasSleeves) finalValue += ` (${item["Sleeves"]} Sleeves)`;
      }

      if (key === "Brand") {
        if (hasCollaboration) finalValue += ` x ${item["Collaboration"]}`;
      }

      // ===== New layout =====
      const row = document.createElement("div");
      row.className = "detail-row";

      const label = document.createElement("div");
      label.className = "detail-label";
      label.textContent = key;

      const valueDiv = document.createElement("div");
      valueDiv.className = "detail-value";
      if ((key === "Team" || key === "Person") && value.includes("/")) {

        const parts = value.split("/").map(v => v.trim());

        valueDiv.innerHTML = parts.join(" · ");

      } else {
        valueDiv.textContent = finalValue;
      }

      row.appendChild(label);
      row.appendChild(valueDiv);
      details.appendChild(row);

    });

  });