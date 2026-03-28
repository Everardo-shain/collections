const params = new URLSearchParams(window.location.search);

// 🔥 multi-values desde URL
function getArrayParam(key) {
  return params.get(key)?.split(",").map(v => v.trim()) || [];
}


// filtros breadcrumb
const FILTER_KEYS = [
  "entity",
  "season",
  "team",
  "country",
  "competition",
  "brand",
  "person"
];

const SIDEBAR_KEYS = [
  "category",
  "product",
  "entity",
  "team",
  "season",
  "style",
  "release",
  "competition",
  "country",
  "confederation",
  "technology",
  "brand",
  "collaboration",
  "size",
  "sleeves",
  "person",
  "patch",
  "packaging",
  "signature"
];

const SEARCH_KEYS = [
  "Display Name",
  "Team",
  "Person",
  "Style",
  "Season",
  "Competition",
  "Country",
  "Confederation",
  "Brand",
  "Product",
  "Entity",
  "Category",
  "Release",
  "Technology",
  "Collaboration",
  "Print",
  "Patch"
];

function formatKey(key) {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

const sidebarState = {};

SIDEBAR_KEYS.forEach(key => {
  sidebarState[key] = getArrayParam(key);
});

const filtersState = {};

FILTER_KEYS.forEach(key => {
  filtersState[key] = getArrayParam(key);
});
const filterSearch = params.get("search") || "";

fetch("../football/football_collection.json")
  .then(response => response.json())
  .then(data => {
    const totalItems = data.length;
    const grid = document.getElementById("grid");
    const filters = document.getElementById("filters");

    // ===== Search =====
    let currentSearch = normalize(filterSearch || "");
    const searchInput = document.getElementById("search");
    if (searchInput && filterSearch) {
      searchInput.value = filterSearch;
    }

    const searchInfo = document.getElementById("search-info");

    function matchField(itemValue, filterArray) {
      if (!filterArray || filterArray.length === 0) return true;
      if (!itemValue) return false;

      const values = itemValue.split("/").map(v => v.trim());
      return filterArray.some(f => values.includes(f));
    }

    // ===== Breadcrumbs =====
    let parts = [];

    function link(label, query) {
      return `<a href="./index.html${query}">${label}</a>`;
    }

    parts.push(link("Home", ""));

    let query = "";

    FILTER_KEYS.forEach(key => {
      const values = filtersState[key];
      if (!values.length) return;

      query += `${query ? "&" : "?"}${key}=${encodeURIComponent(values.join(","))}`;

      parts.push(link(values[0], query));
    });

    filters.innerHTML = parts.length > 1
      ? parts.join(` <span class="breadcrumb-separator">></span> `)
      : "";

    function renderSidebar() {
      const sidebar = document.getElementById("filters-sidebar");

      // 🔥 limpiar (pero conservar active filters)
      const activeFilters = document.getElementById("active-filters-container");
      sidebar.innerHTML = "";

      SIDEBAR_KEYS.forEach(key => {
        const group = document.createElement("div");
        group.className = "filter-group";

        const header = document.createElement("div");
        header.className = "filter-header";
        header.textContent = formatKey(key);

        const content = document.createElement("div");
        content.className = "filter-content";
        content.id = `filter-${key}`;

        group.appendChild(header);
        group.appendChild(content);
        sidebar.appendChild(group);
      });

      // 🔥 volver a agregar active filters al final
      if (activeFilters) {
        sidebar.appendChild(activeFilters);
      }
    }
    // ===== Create Filters (NEW) =====
    function createFilterOptions(container, key) {
      if (!container) return;

      container.dataset.key = key; // 🔥 importante para luego recalcular
      container.dataset.expanded = "false";

      renderFilterOptions(container, key);
    }

    function renderFilterOptions(container, key) {

      const selectedValues = getSelectedValues(container.id);

      const tempFiltered = data.filter(item => {


      const matchesFilters = Object.entries(filtersState).every(([key, values]) => {
        const itemKey = key.charAt(0).toUpperCase() + key.slice(1); // entity → Entity
        return matchField(item[itemKey], values);
      });

        // 🔥 aplicar sidebar EXCEPTO el actual
        const matchesSidebar = SIDEBAR_KEYS.every(sideKey => {

          // 🔥 excluir el filtro actual
          if (formatKey(sideKey) === key) return true;

          const selected = getSelectedValues(`filter-${sideKey}`);
          if (!selected.length) return true;

          const itemValues = item[formatKey(sideKey)]
            ?.split("/")
            .map(v => v.trim()) || [];

          return selected.some(v => itemValues.includes(v));
        });

        const words = currentSearch.split(" ").filter(w => w);

        const matchesSearch =
          words.length === 0 ||
          words.every(word =>
            SEARCH_KEYS.some(key =>
              normalize(item[key])?.includes(word)
            )
          );

        return matchesFilters && matchesSidebar && matchesSearch;
      });

      // 🔥 contar ocurrencias
      const counts = {};
      tempFiltered.forEach(item => {
        const rawValue = item[key];
        if (!rawValue || rawValue === "-") return;

        // 🔥 dividir por "/"
        const valuesArray = rawValue.split("/").map(v => v.trim());

        valuesArray.forEach(value => {
          counts[value] = (counts[value] || 0) + 1;
        });
      });

      const values = Object.keys(counts).sort();

      const limit = 10;
      const expanded = container.dataset.expanded === "true";

      container.innerHTML = "";

      values.forEach((value, index) => {

        if (!expanded && index >= limit) return;

        const label = document.createElement("label");
        label.className = "filter-option";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = value;
        checkbox.checked =
          selectedValues.includes(value) ||
          sidebarState[key.toLowerCase()]?.includes(value);

        checkbox.addEventListener("change", render);

        const text = document.createElement("span");
        text.innerHTML = `
          ${value} <span class="filter-count">(${counts[value]})</span>
        `;

        label.appendChild(checkbox);
        label.appendChild(text);

        container.appendChild(label);
      });

      // ===== Show More =====
      if (values.length > limit) {
        const toggle = document.createElement("div");
        toggle.className = "filter-toggle";
        toggle.textContent = expanded ? "Show less" : "Show more";

        toggle.addEventListener("click", () => {
          container.dataset.expanded = expanded ? "false" : "true";
          renderFilterOptions(container, key);
        });

        container.appendChild(toggle);
      }
    }
    
    renderSidebar();
    initAccordion();
    SIDEBAR_KEYS.forEach(key => {
      const el = document.getElementById(`filter-${key}`);
      createFilterOptions(el, formatKey(key));
    });

    function getSelectedValues(containerId) {
      return Array.from(
        document.querySelectorAll(`#${containerId} input:checked`)
      ).map(input => input.value);
    }

    // ===== Accordion (NEW) =====
    function initAccordion() {
      document.querySelectorAll(".filter-header").forEach(header => {
        header.addEventListener("click", () => {

          const group = header.parentElement;
          const content = group.querySelector(".filter-content");
          const key = content.dataset.key;

          const isOpening = !group.classList.contains("active");

          group.classList.toggle("active");

          if (!isOpening) {
            content.dataset.expanded = "false";
            content.classList.remove("expanded");
            renderFilterOptions(content, key);
          }

        });
      });
    }

    // ===== Active Filters (chips) =====
    function renderActiveFilters() {

      const container = document.getElementById("active-filters");
      const wrapper = document.getElementById("active-filters-container");

      if (!container || !wrapper) return;

      container.innerHTML = "";

      function createChip(value, type) {
        const chip = document.createElement("div");
        chip.className = "filter-chip";

        const text = document.createElement("span");
        text.textContent = value;

        const remove = document.createElement("button");
        remove.textContent = "✕";

        remove.addEventListener("click", () => {
          removeFilter(value, type);
        });

        chip.appendChild(text);
        chip.appendChild(remove);

        container.appendChild(chip);
      }

      SIDEBAR_KEYS.forEach(key => {
        const selected = getSelectedValues(`filter-${key}`);
        selected.forEach(v => createChip(v, formatKey(key)));
      });

      // 🔥 ocultar si no hay filtros
      const hasActive = SIDEBAR_KEYS.some(key =>
        getSelectedValues(`filter-${key}`).length > 0
      );

      wrapper.style.display = hasActive ? "block" : "none";
    }

    // ===== Remove single filter =====
    function removeFilter(value, type) {

      const containerId = `filter-${type.toLowerCase()}`;

      document.querySelectorAll(`#${containerId} input`).forEach(input => {
        if (input.value === value) {
          input.checked = false;
        }
      });

      render();
    }

    // ===== Clear all =====
    document.getElementById("clear-all")?.addEventListener("click", () => {
      window.location.href = window.location.pathname;
    });

    // ===== Render =====
    function render() {

      updateURL();

      const hasBreadcrumbFilters = Object.values(filtersState)
        .some(arr => arr.length > 0);

      if (!hasBreadcrumbFilters) {
        renderActiveFilters();
      } else {
        const wrapper = document.getElementById("active-filters-container");
        if (wrapper) wrapper.style.display = "none";
      }

      const filteredData = data.filter(item => {
      const matchesFilters = Object.entries(filtersState).every(([key, values]) => {
        const itemKey = key.charAt(0).toUpperCase() + key.slice(1); // entity → Entity
        return matchField(item[itemKey], values);
      });

        const matchesSidebar = SIDEBAR_KEYS.every(sideKey => {
          const selected = getSelectedValues(`filter-${sideKey}`);
          if (!selected.length) return true;

          const itemValues = item[formatKey(sideKey)]
            ?.split("/")
            .map(v => v.trim()) || [];

          return selected.some(v => itemValues.includes(v));
        });

        const words = currentSearch.split(" ").filter(w => w);

        const matchesSearch =
          words.length === 0 ||
          words.every(word =>
            SEARCH_KEYS.some(key =>
              normalize(item[key])?.includes(word)
            )
          );

        return matchesFilters && matchesSidebar && matchesSearch;
        
      });
      const resultsCount = document.getElementById("results-count");

      if (resultsCount) {

        if (filteredData.length !== totalItems) {
          resultsCount.innerHTML = `
            <strong>${filteredData.length}</strong> of 
            <span class="total-count">${totalItems}</span> Items
          `;
        } else {
          resultsCount.innerHTML = `<strong>${totalItems}</strong> Items`;
        }
      }

      // ===== Search info =====
      if (currentSearch) {
        searchInfo.innerHTML = `
          Search results for: "<em>${filterSearch}</em>"
          <a href="./index.html" class="clear-search" title="Clear search">✕</a>
        `;
      } else {
        searchInfo.textContent = "";
      }

      // ===== Sort =====
      filteredData.sort((a, b) => a.ID.localeCompare(b.ID));

      // ===== Render grid =====
      grid.innerHTML = "";

      filteredData.forEach(item => {

        const card = document.createElement("div");
        card.className = "card";

        const link = document.createElement("a");
        link.href = `item.html?id=${encodeURIComponent(item.ID)}`;

        const img = document.createElement("img");
        img.src = "../assets/images/ph_front.jpg";

        const name = document.createElement("p");
        name.textContent = item["Display Name"];

        link.appendChild(img);
        link.appendChild(name);
        card.appendChild(link);
        grid.appendChild(card);
      });

      if (filteredData.length === 0) {
        grid.innerHTML = "<p>No items found</p>";
      }

      // 🔥 actualizar contadores dinámicamente
      SIDEBAR_KEYS.forEach(key => {
        const el = document.getElementById(`filter-${key}`);
        renderFilterOptions(el, formatKey(key));
      });
    }

    function normalize(text) {
      return text
        ?.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    }

    function updateURL() {

      const params = new URLSearchParams(window.location.search);

      // limpiar solo sidebar
      SIDEBAR_KEYS.forEach(key => params.delete(key));

      SIDEBAR_KEYS.forEach(key => {
        const selected = getSelectedValues(`filter-${key}`);
        if (selected.length) {
          params.set(key, selected.join(","));
        }
      });

      const newURL = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, "", newURL);
    }
    // ===== Init =====
    render();

  });