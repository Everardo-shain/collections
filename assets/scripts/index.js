const params = new URLSearchParams(window.location.search);

// 🔥 multi-values desde URL
function getArrayParam(key) {
  return params.get(key)?.split(",").map(v => v.trim()) || [];
}

// ===== URL params =====
const urlProducts = getArrayParam("product");
const urlTeams = getArrayParam("team");

// 🔥 nuevos filtros
const filterEntity = params.get("entity");
const filterSeason = params.get("season");
const filterCountry = params.get("country");
const filterCompetition = params.get("competition");
const filterBrand = params.get("brand");
const filterPerson = params.get("person");
const filterSearch = params.get("search");
const filterTeam = params.get("team");

fetch("../football/football_collection.json")
  .then(response => response.json())
  .then(data => {
    const totalItems = data.length;
    const grid = document.getElementById("grid");
    const filters = document.getElementById("filters");

    // ===== Search =====
    let currentSearch = filterSearch ? normalize(filterSearch) : "";
    const searchInput = document.getElementById("search");
    if (searchInput && filterSearch) {
      searchInput.value = filterSearch;
    }

    const searchInfo = document.getElementById("search-info");

    function matchField(itemValue, filterValue) {
      if (!filterValue) return true;
      if (!itemValue) return false;

      const values = itemValue.split("/").map(v => v.trim());
      return values.includes(filterValue);
    }

    // ===== Breadcrumbs =====
    let parts = [];

    function link(label, query) {
      return `<a href="./index.html${query}">${label}</a>`;
    }

    parts.push(link("Home", ""));

    if (filterEntity) {
      parts.push(link(filterEntity, `?entity=${encodeURIComponent(filterEntity)}`));
    }

    if (filterSeason) {
      parts.push(link(
        filterSeason,
        `?entity=${encodeURIComponent(filterEntity)}&season=${encodeURIComponent(filterSeason)}`
      ));
    }

    if (filterTeam) {
      parts.push(link(
        filterTeam,
        `?entity=${encodeURIComponent(filterEntity)}&season=${encodeURIComponent(filterSeason)}&team=${encodeURIComponent(filterTeam)}`
      ));
    }

    filters.innerHTML = parts.length > 1
      ? parts.join(` <span class="breadcrumb-separator">></span> `)
      : "";

    // ===== Create Filters (NEW) =====
    const productContainer = document.getElementById("filter-product");
    const teamContainer = document.getElementById("filter-team");

    function createFilterOptions(container, key) {
      if (!container) return;

      container.dataset.key = key; // 🔥 importante para luego recalcular
      container.dataset.expanded = "false";

      renderFilterOptions(container, key);
    }

    function renderFilterOptions(container, key) {

      const selectedValues = getSelectedValues(container.id);

      // 🔥 aplicar filtros EXCEPTO este mismo
      const selectedProducts = getSelectedValues("filter-product");
      const selectedTeams = getSelectedValues("filter-team");

      const tempFiltered = data.filter(item => {

        function validFilter(filter, value) {
          return !filter || (value && value.trim() === filter);
        }

        const matchesFilters =
          (!filterEntity || item["Entity"] === filterEntity) &&
          (!filterSeason || item["Season"] === filterSeason) &&
          matchField(item["Team"], filterTeam) &&
          (!filterCountry || item["Country"] === filterCountry) &&
          (!filterCompetition || item["Competition"] === filterCompetition) &&
          (!filterBrand || item["Brand"] === filterBrand) &&
          matchField(item["Person"], filterPerson);

        // 🔥 aplicar sidebar EXCEPTO el actual
        const itemTeams = item["Team"]?.split("/").map(v => v.trim()) || [];

        const matchesSidebar =
          (key === "Product" || selectedProducts.length === 0 || selectedProducts.includes(item["Product"])) &&
          (key === "Team" || selectedTeams.length === 0 || selectedTeams.some(team => itemTeams.includes(team)));

        const words = currentSearch.split(" ").filter(w => w);

        const matchesSearch =
          words.length === 0 ||
          words.every(word =>
            normalize(item["Display Name"])?.includes(word) ||
            normalize(item["Team"])?.includes(word) ||
            normalize(item["Name"])?.includes(word)
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
          (key === "Product" && urlProducts.includes(value)) ||
          (key === "Team" && urlTeams.includes(value));

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
    createFilterOptions(productContainer, "Product");
    createFilterOptions(teamContainer, "Team");

    function getSelectedValues(containerId) {
      return Array.from(
        document.querySelectorAll(`#${containerId} input:checked`)
      ).map(input => input.value);
    }

    // ===== Accordion (NEW) =====
    document.querySelectorAll(".filter-header").forEach(header => {
      header.addEventListener("click", () => {

        const group = header.parentElement;
        const content = group.querySelector(".filter-content");
        const key = content.dataset.key; // 🔥 importante

        const isOpening = !group.classList.contains("active");

        group.classList.toggle("active");

        // 🔥 si se está cerrando → reset + re-render
        if (!isOpening) {
          content.dataset.expanded = "false";
          content.classList.remove("expanded");

          renderFilterOptions(content, key); // 🔥 ESTO FALTABA
        }

      });
    });

    // ===== Active Filters (chips) =====
    function renderActiveFilters(selectedProducts, selectedTeams) {

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

      selectedProducts.forEach(v => createChip(v, "Product"));
      selectedTeams.forEach(v => createChip(v, "Team"));

      // 🔥 ocultar si no hay filtros
      wrapper.style.display =
        (selectedProducts.length || selectedTeams.length) ? "block" : "none";
    }

    // ===== Remove single filter =====
    function removeFilter(value, type) {

      const containerId = type === "Product" ? "filter-product" : "filter-team";

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

      function validFilter(filter, value) {
        return !filter || (value && value.trim() === filter);
      }

      const selectedProducts = getSelectedValues("filter-product");
      const selectedTeams = getSelectedValues("filter-team");

      updateURL(selectedProducts, selectedTeams);

      renderActiveFilters(selectedProducts, selectedTeams);

      const filteredData = data.filter(item => {
      const matchesFilters =
        (!filterEntity || item["Entity"] === filterEntity) &&
        (!filterSeason || item["Season"] === filterSeason) &&
        matchField(item["Team"], filterTeam) &&
        (!filterCountry || item["Country"] === filterCountry) &&
        (!filterCompetition || item["Competition"] === filterCompetition) &&
        (!filterBrand || item["Brand"] === filterBrand) &&
        matchField(item["Person"], filterPerson);

        const itemTeams = item["Team"]?.split("/").map(v => v.trim()) || [];

        const matchesSidebar =
          (selectedProducts.length === 0 || selectedProducts.includes(item["Product"])) &&
          (selectedTeams.length === 0 || selectedTeams.some(team => itemTeams.includes(team)));

        const words = currentSearch.split(" ").filter(w => w);

        const matchesSearch =
          words.length === 0 ||
          words.every(word =>
            normalize(item["Display Name"])?.includes(word) ||
            normalize(item["Team"])?.includes(word) ||
            normalize(item["Name"])?.includes(word) ||
            normalize(item["Style"])?.includes(word) ||
            normalize(item["Season"])?.includes(word) ||
            normalize(item["Competition"])?.includes(word) ||
            normalize(item["Country"])?.includes(word) ||
            normalize(item["Confederation"])?.includes(word) ||
            normalize(item["Brand"])?.includes(word)
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
      renderFilterOptions(productContainer, "Product");
      renderFilterOptions(teamContainer, "Team");
    }

    function normalize(text) {
      return text
        ?.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    }

    function updateURL(selectedProducts, selectedTeams) {

      const params = new URLSearchParams(window.location.search);

      // limpiar solo sidebar
      params.delete("product");
      params.delete("team");

      if (selectedProducts.length) {
        params.set("product", selectedProducts.join(","));
      }

      if (selectedTeams.length) {
        params.set("team", selectedTeams.join(","));
      }

      const newURL = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, "", newURL);
    }
    // ===== Init =====
    render();

  });