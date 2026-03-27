document.addEventListener("submit", (e) => {

  if (e.target.id !== "search-form") return;

  e.preventDefault();

  const input = e.target.querySelector("#search");
  if (!input) return;

  const query = input.value.trim();
  if (!query) return;

  // 🔥 Siempre construye relativo al proyecto actual
  const basePath = window.location.pathname.includes("/football/")
    ? window.location.pathname.split("/football/")[0] + "/football/index.html"
    : "football/index.html";

  const params = new URLSearchParams();
  params.set("search", query);

  window.location.href = `${basePath}?${params.toString()}`;

});