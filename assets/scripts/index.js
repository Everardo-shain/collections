const params = new URLSearchParams(window.location.search);

const filterEntity = params.get("entity");
const filterSeason = params.get("season");
const filterTeam = params.get("team");
const filterSearch = params.get("search");

fetch("../football/football_collection.json")
  .then(response => response.json())
  .then(data => {

    const grid = document.getElementById("grid");
    const filters = document.getElementById("filters");

    // ===== Search =====
    let currentSearch = filterSearch ? normalize(filterSearch) : "";
    const searchInput = document.getElementById("search");
    if (searchInput && filterSearch) {
      searchInput.value = filterSearch;
    }

    const searchInfo = document.getElementById("search-info");

    if (filterSearch) {
      searchInfo.textContent = `Search: "${filterSearch}"`;
    } else {
      searchInfo.textContent = "";
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

    // ===== Render =====
    function render() {

      function validFilter(filter, value) {
        return !filter || (value && value.trim() === filter);
      }

    const filteredData = data.filter(item => {

      const matchesFilters =
        validFilter(filterEntity, item["Entity"]) &&
        validFilter(filterSeason, item["Season"]) &&
        validFilter(filterTeam, item["Team"]);

      const words = currentSearch.split(" ").filter(w => w);

      const matchesSearch =
        words.length === 0 ||
        words.every(word => {

          return (
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

        });

        return matchesFilters && matchesSearch; // ✅ CLAVE
    });

    const searchInfo = document.getElementById("search-info");

    if (currentSearch) {
      searchInfo.innerHTML = `
        <strong>${filteredData.length}</strong> results for "<em>${filterSearch}</em>"
        <a href="./index.html" class="clear-search">Clear</a>
      `;
    } else {
      searchInfo.textContent = "";
    }

      filteredData.sort((a, b) => a.ID.localeCompare(b.ID));

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
    }
    function normalize(text) {
      return text
        ?.toLowerCase()
        .normalize("NFD")                // separa acentos
        .replace(/[\u0300-\u036f]/g, ""); // elimina acentos
    }
    // ===== Init =====
    render();

  });