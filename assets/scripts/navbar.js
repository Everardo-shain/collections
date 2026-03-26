document.addEventListener("DOMContentLoaded", () => {

  setTimeout(() => {

    const searchInput = document.getElementById("search");
    if (!searchInput) return;

    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const query = e.target.value.trim();

        if (!query) return;

        window.location.href = `/football/index.html?search=${encodeURIComponent(query)}`;
      }
    });

  }, 100);

});