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

    // Helper
    function valid(value) {
    return value && value.trim() !== "-" && value.trim() !== "";
    }

    // Base
    let breadcrumbParts = [];

    // Home
    breadcrumbParts.push(`<a href="./index.html">Home</a>`);

    // Entity
    if (valid(item["Entity"])) {
    breadcrumbParts.push(
        `<a href="./index.html?entity=${encodeURIComponent(item["Entity"])}">${item["Entity"]}</a>`
    );
    }

    // Season
    if (valid(item["Season"])) {
    breadcrumbParts.push(
        `<a href="./index.html?entity=${encodeURIComponent(item["Entity"])}&season=${encodeURIComponent(item["Season"])}">${item["Season"]}</a>`
    );
    }

    // Team
    if (valid(item["Team"])) {
    breadcrumbParts.push(
        `<a href="./index.html?entity=${encodeURIComponent(item["Entity"])}&season=${encodeURIComponent(item["Season"])}&team=${encodeURIComponent(item["Team"])}">${item["Team"]}</a>`
    );
    }

    // Style (último → sin link)
    if (valid(item["Style"])) {
    breadcrumbParts.push(`<span>${item["Style"]}</span>`);
    }

    // Join with separator
    breadcrumbs.innerHTML = breadcrumbParts.join(` <span class="breadcrumb-separator">></span> `);

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

    Object.entries(item).forEach(([key, value]) => {

      if (
        key === "ID" ||
        key === "Display Name" ||
        key === "Variant" ||
        key === "Category" ||
        key === "Entity" ||
        key === "Nameset" ||
        key === "Sleeves" ||
        key === "Collaboration"
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
      valueDiv.textContent = finalValue;

      row.appendChild(label);
      row.appendChild(valueDiv);
      details.appendChild(row);

    });

  });