import {
  NO_SPLIT_FIELDS,
  HIDDEN_FIELDS,
  FIELD_COMBINATIONS,
  FIELD_VISIBILITY_RULES,
  breadcrumbConfig,
  BREADCRUMB_RESOLVER,
  valid,
  VALUE_SEPARATOR
} from "./collections/football/config.js";

const params = new URLSearchParams(window.location.search);
const id = params.get("id");

// ===== HELPERS =====

function getValues(item, key) {
  const value = item[key];

  if (!valid(value)) return [];

  if (!NO_SPLIT_FIELDS.includes(key)) {
    return value.split(VALUE_SEPARATOR).map(v => v.trim());
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

// ===== FETCH =====

fetch("../data/json_files/football_collection.json")
  .then(res => res.json())
  .then(data => {

    const item = data.find(i => i.ID && i.ID.trim() === id.trim());

    if (!item) {
      document.body.innerHTML = "<p>Item not found</p>";
      return;
    }

    // ===== Breadcrumbs =====
    const breadcrumbs = document.getElementById("breadcrumbs");

    const config = BREADCRUMB_RESOLVER({
      item,
      breadcrumbConfig
    });

    if (!config) {
      breadcrumbs.innerHTML = `<a href="./index.html">Home</a>`;
    } else {

      let parts = [];
      let currentParams = {};

      parts.push(`<a href="./index.html">Home</a>`);

      config.forEach(key => {
        const values = getValues(item, key);
        values.forEach(value => {
          // 🔥 Agregamos el prefijo nav_ para separarlo del sidebar
          const paramKey = "nav_" + key.toLowerCase(); 
          currentParams[paramKey] = value;
          parts.push(link(value, currentParams));
        });
      });

      if (valid(item["Display Name"])) {
        parts.push(`<span>${item["Display Name"]}</span>`);
      }

      breadcrumbs.innerHTML =
        parts.join(` <span class="breadcrumb-separator">></span> `);
    }

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

    Object.entries(item).forEach(([key, value]) => {

      if (HIDDEN_FIELDS.includes(key)) return;

      if (FIELD_VISIBILITY_RULES[key] && !FIELD_VISIBILITY_RULES[key](item, value)) return;

      if (!valid(value)) return;

      let finalValue = value;

      if (FIELD_COMBINATIONS[key]) {
        finalValue = FIELD_COMBINATIONS[key](item, value);
      }

      const row = document.createElement("div");
      row.className = "detail-row";

      const label = document.createElement("div");
      label.className = "detail-label";
      label.textContent = key;

      const valueDiv = document.createElement("div");
      valueDiv.className = "detail-value";

      if (!NO_SPLIT_FIELDS.includes(key) && value.includes(VALUE_SEPARATOR)) {
        const parts = value.split(VALUE_SEPARATOR).map(v => v.trim());
        valueDiv.innerHTML = parts.join(" · ");
      } else {
        valueDiv.textContent = finalValue;
      }

      row.appendChild(label);
      row.appendChild(valueDiv);
      details.appendChild(row);

    });

    // ===== Notes =====
    const notes = item["Notes"];

    if (valid(notes)) {
      const notesDiv = document.createElement("div");
      notesDiv.className = "detail-notes";
      notesDiv.textContent = notes;
      details.appendChild(notesDiv);
    }

  });