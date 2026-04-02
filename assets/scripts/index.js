import {
  FIELD_MAP,
  FILTER_KEYS,
  SIDEBAR_KEYS,
  CUSTOM_FILTERS,
  DETAILS_FILTERS,
  SEARCH_KEYS,
  breadcrumbConfig,
  BREADCRUMB_RESOLVER,
  valid,
  NO_SPLIT_FIELDS,
  VALUE_SEPARATOR
} from "./collections/football/config.js";

const params = new URLSearchParams(window.location.search);

function getFieldValue(item, key) {
  const field = FIELD_MAP[key];
  if (!field) return null;
  return item[field];
}

// 🔥 multi-values desde URL
function getArrayParam(key) {
  return params.get(key)?.split(",").map(v => v.trim()) || [];
}


function formatKey(key) {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function getFilterLabel(key) {
  return CUSTOM_FILTERS[normalizeKey(key)]?.label || formatKey(key);
}

function normalizeKey(key) {
  return key.toLowerCase().replace(/\s+/g, "-");
}

const sidebarState = {};

SIDEBAR_KEYS.forEach(key => {
  sidebarState[key] = getArrayParam(key);
});

const filtersState = {};

FILTER_KEYS.forEach(key => {
  // 🔥 Leemos la URL buscando el prefijo nav_
  let vals = getArrayParam("nav_" + key);
  
  // Fallback: por si category/product vienen de algún menú principal sin prefijo
  if (vals.length === 0 && ["category", "product"].includes(key)) {
    vals = getArrayParam(key);
  }
  
  filtersState[key] = vals;
});
const filterSearch = params.get("search") || "";

function renderCategoryHeader(parts) {
  const container = document.getElementById("category-header");
  if (!container) return;

  if (!parts || parts.length <= 1) {
    container.innerHTML = `<h1>All Items</h1>`;
    return;
  }

  // 🔥 tomar el último elemento del breadcrumb
  const lastPart = parts[parts.length - 1];

  // 🔥 extraer solo el texto (sin <a>)
  const temp = document.createElement("div");
  temp.innerHTML = lastPart;
  const title = temp.textContent;

  container.innerHTML = `<h1>${title}</h1>`;
}

fetch("../data/json_files/football_collection.json")
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

    function getItemValues(key, value) {
      if (!valid(value)) return [];

      if (NO_SPLIT_FIELDS.includes(key)) {
        return [value.trim()];
      }

      return value.split(VALUE_SEPARATOR).map(v => v.trim());
    }

    function matchField(itemValue, filterArray, key) {
      if (!filterArray || filterArray.length === 0) return true;
      if (!itemValue) return false;

      const values = getItemValues(key, itemValue);
      return filterArray.some(f => values.includes(f));
    }

    // ===== Breadcrumbs =====
    let parts = [];

    function link(label, paramsObj = {}) {
      const search = new URLSearchParams(paramsObj);
      return `<a href="./index.html?${search.toString()}">${label}</a>`;
    }

    // Home siempre
    parts.push(`<a href="./index.html">Home</a>`);

    // ===== MODOS =====
    const hasSearch = !!filterSearch;
    const hasCategory = filtersState.category?.length;
    const hasProduct = filtersState.product?.length;

    // detectar si hay filtros reales (excluyendo category/product/search)
    const hasOtherFilters = Object.entries(filtersState).some(([key, values]) => {
      if (["category", "product"].includes(key)) return false;
      return values.length > 0;
    });


    // ===== 1. SEARCH =====
    if (hasSearch) {

      parts.push(`<span>Search: "${filterSearch}"</span>`);

    // ===== 2. NAVIGATION =====
    } else if (hasCategory) {
      let currentParams = {};
      const category = filtersState.category[0];
      currentParams.nav_category = category; // 🔥 Agregamos prefijo nav_
      parts.push(link(category, currentParams));

      if (hasProduct) {
        const product = filtersState.product[0];
        currentParams.nav_product = product; // 🔥 Agregamos prefijo nav_
        parts.push(link(product, currentParams));
      }

    // ===== 3. FILTERS =====
    } else if (hasOtherFilters) {
      const config = BREADCRUMB_RESOLVER({
        filtersState,
        data,
        matchField,
        breadcrumbConfig
      });

      if (config) {
        let currentParams = {};

        config.forEach(key => {
          const paramKey = "nav_" + key.toLowerCase(); // 🔥 Agregamos prefijo nav_
          const values = filtersState[key.toLowerCase()];

          if (!values?.length) return;

          const value = values[0];
          currentParams[paramKey] = value;

          parts.push(link(value, currentParams));
        });
      }

    // ===== 4. DEFAULT =====
    } else {
      parts.push(`<span>All Items</span>`);
    }


    // ===== render =====
    filters.innerHTML =
      parts.length > 1
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
        header.textContent = getFilterLabel(key);

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

      // ===== FILTRADO BASE (para counts dinámicos) =====
      const tempFiltered = data.filter(item => {

        const matchesFilters = Object.entries(filtersState).every(([key, values]) => {
          const itemKey = key.charAt(0).toUpperCase() + key.slice(1);
          return matchField(item[itemKey], values, itemKey);
        });

        const matchesSidebar = SIDEBAR_KEYS.every(sideKey => {

          if (normalizeKey(sideKey) === normalizeKey(key)) return true;

          // 🔥 CASO DETAILS
          if (sideKey === "details") {
            const selectedDetails = getSelectedValues("filter-details");
            if (!selectedDetails.length) return true;

            return selectedDetails.every(detail => {
              const fn = DETAILS_FILTERS[detail];
              return fn ? fn(item) : true;
            });
          }

          const selected = getSelectedValues(`filter-${sideKey}`);
          if (!selected.length) return true;

          const raw = getFieldValue(item, sideKey);
          const itemValues = raw
            ?.split(VALUE_SEPARATOR)
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

      // ===== 🔥 CASO DETAILS =====
      if (key === "Details") {

        const counts = {};

        Object.entries(DETAILS_FILTERS).forEach(([detail, fn]) => {
          counts[detail] = tempFiltered.filter(item => fn(item)).length;
        });

        container.innerHTML = "";

        Object.keys(DETAILS_FILTERS).forEach(detail => {

          const label = document.createElement("label");
          label.className = "filter-option";

          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.value = detail;
          checkbox.checked =
            selectedValues.includes(detail) ||
            sidebarState["details"]?.includes(detail);

          checkbox.addEventListener("change", render);

          const text = document.createElement("span");
          text.innerHTML = `
            ${detail} <span class="filter-count">(${counts[detail]})</span>
          `;

          label.appendChild(checkbox);
          label.appendChild(text);

          container.appendChild(label);
        });

        return; // 🔥 IMPORTANTE: salir aquí
      }
      // ===== Custom filters =====
      const customConfig = CUSTOM_FILTERS[normalizeKey(key)];

      if (customConfig) {

        const config = customConfig;

        const counts = {};

        tempFiltered.forEach(item => {
          const values = config.getValues(item);

          values.forEach(v => {
            counts[v] = (counts[v] || 0) + 1;
          });
        });

        const values = Object.keys(counts).sort();

        container.innerHTML = "";

        values.forEach(value => {

          const label = document.createElement("label");
          label.className = "filter-option";

          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.value = value;

          checkbox.checked =
            selectedValues.includes(value) ||
            sidebarState[normalizeKey(key)]?.includes(value);

          checkbox.addEventListener("change", render);

          const text = document.createElement("span");
          text.innerHTML = `
            ${value} <span class="filter-count">(${counts[value]})</span>
          `;

          label.appendChild(checkbox);
          label.appendChild(text);

          container.appendChild(label);
        });

        return;
      }
      // ===== 🔥 NORMAL (resto de filtros) =====
      const counts = {};

      tempFiltered.forEach(item => {
        const rawValue = getFieldValue(item, normalizeKey(key));
        if (!rawValue || rawValue === "-") return;

        const valuesArray = getItemValues(key, rawValue);
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
          sidebarState[normalizeKey(key)]?.includes(value);

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

      const params = new URLSearchParams(window.location.search);
      const key = type.toLowerCase();

      const values = params.get(key)?.split(",") || [];

      const newValues = values.filter(v => v !== value);

      if (newValues.length) {
        params.set(key, newValues.join(","));
      } else {
        params.delete(key);
      }

      window.location.search = params.toString(); // 🔥 recarga con estado limpio
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
          return matchField(item[itemKey], values, itemKey);
        });

        const matchesSidebar = SIDEBAR_KEYS.every(sideKey => {

          // ===== DETAILS =====
          if (sideKey === "details") {
            const selected = getSelectedValues("filter-details");
            if (!selected.length) return true;

            return selected.every(detail => {
              const fn = DETAILS_FILTERS[detail];
              return fn ? fn(item) : true;
            });
          }

          // ===== CUSTOM =====
          const custom = CUSTOM_FILTERS[normalizeKey(sideKey)];
          if (custom) {
            const selected = getSelectedValues(`filter-${sideKey}`);
            if (!selected.length) return true;

            const values = custom.getValues(item);
            return selected.some(v => values.includes(v));
          }

          // ===== NORMAL =====
          const selected = getSelectedValues(`filter-${sideKey}`);
          if (!selected.length) return true;

          const raw = getFieldValue(item, sideKey);
          const itemValues = raw
            ?.split(VALUE_SEPARATOR)
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

        return matchesFilters && matchesSidebar && matchesSearch ;
        
      });

      renderCategoryHeader(parts);
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
