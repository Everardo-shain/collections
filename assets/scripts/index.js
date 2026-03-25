const params = new URLSearchParams(window.location.search);

const filterEntity = params.get("entity");
const filterSeason = params.get("season");
const filterTeam = params.get("team");

fetch("../football/football_collection.json")
  .then(response => response.json())
  .then(data => {

    // ===== Filtering params =====
    const params = new URLSearchParams(window.location.search);
    const filterEntity = params.get("entity");
    const filterSeason = params.get("season");
    const filterTeam = params.get("team");

    // ===== Mostrar filtros (AQUÍ) =====
    const filters = document.getElementById("filters");

    let text = [];

    if (filterEntity) text.push(filterEntity);
    if (filterSeason) text.push(filterSeason);
    if (filterTeam) text.push(filterTeam);

    filters.textContent = text.length ? text.join(" > ") : "";

    // ===== Filtering data =====
    function validFilter(filter, value) {
      return !filter || (value && value.trim() === filter);
    }

    const filteredData = data.filter(item =>
      validFilter(filterEntity, item["Entity"]) &&
      validFilter(filterSeason, item["Season"]) &&
      validFilter(filterTeam, item["Team"])
    );

    // ===== Sorting =====
    filteredData.sort((a, b) => a.ID.localeCompare(b.ID));

    const grid = document.getElementById("grid");

    const basePath = "../assets/images/";
    const thumbnail = "ph_front.jpg";

    // Clear grid
    grid.innerHTML = "";

    filteredData.forEach(item => {

      const card = document.createElement("div");
      card.className = "card";

      const link = document.createElement("a");
      link.href = `item.html?id=${encodeURIComponent(item.ID)}`;

      const img = document.createElement("img");
      img.src = basePath + thumbnail;
      img.alt = item["Display Name"];
      img.loading = "lazy";

      const name = document.createElement("p");
      name.textContent = item["Display Name"];

      link.appendChild(img);
      link.appendChild(name);
      card.appendChild(link);
      grid.appendChild(card);
    });

    // ===== Empty state =====
    if (filteredData.length === 0) {
      grid.innerHTML = "<p>No items found</p>";
    }

  });