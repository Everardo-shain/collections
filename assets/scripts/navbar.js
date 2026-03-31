import { NAVIGATION } from "./collections/football/config.js";

// ===== BASE PATH (reutilizable)
function getBasePath() {
  return window.location.pathname.includes("/football/")
    ? window.location.pathname.split("/football/")[0] + "/football/index.html"
    : "/football/index.html";
}

// ===== NAVBAR =====
export function renderNavbar() {
  const container = document.getElementById("main-nav");

  if (!container) return;

  container.innerHTML = "";

  const basePath = getBasePath();

  Object.entries(NAVIGATION.categories).forEach(([category, products]) => {

    const item = document.createElement("div");
    item.className = "nav-item";

    // ===== CATEGORY
    const mainLink = document.createElement("a");
    mainLink.textContent = category;
    mainLink.href = `${basePath}?category=${encodeURIComponent(category)}`;

    item.appendChild(mainLink);

    // ===== DROPDOWN
    if (products.length) {
      const dropdown = document.createElement("div");
      dropdown.className = "dropdown";

      // 🔥 All Category
      const allLink = document.createElement("a");
      allLink.textContent = `All ${category}`;
      allLink.href = `${basePath}?category=${encodeURIComponent(category)}`;
      dropdown.appendChild(allLink);

      const divider = document.createElement("div");
      divider.className = "dropdown-divider";
      dropdown.appendChild(divider);

      // Products
      products.forEach(product => {
        const subLink = document.createElement("a");
        subLink.textContent = product;
        subLink.href = `${basePath}?category=${encodeURIComponent(category)}&product=${encodeURIComponent(product)}`;
        dropdown.appendChild(subLink);
      });

      item.appendChild(dropdown);
    }

    container.appendChild(item);
  });
}

// ===== SEARCH =====
function initSearch() {
  document.addEventListener("submit", (e) => {

    if (e.target.id !== "search-form") return;

    e.preventDefault();

    const input = e.target.querySelector("#search");
    if (!input) return;

    const query = input.value.trim();
    if (!query) return;

    const basePath = getBasePath();

    const params = new URLSearchParams();
    params.set("search", query);

    window.location.href = `${basePath}?${params.toString()}`;
  });
}

// ===== INIT GLOBAL =====
document.addEventListener("DOMContentLoaded", () => {
  renderNavbar();
  initSearch();
});