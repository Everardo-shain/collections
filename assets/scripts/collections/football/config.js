export function normalizeKey(key) {
  return key
  .toLowerCase()
  .trim()
  .replace(/\s+/g, "-");
}

export const FIELD_MAP = {
  id: "ID",
  displayName: "Display Name",
  category: "Category",
  product: "Product",
  entity: "Entity",
  team: "Team",
  season: "Season",
  style: "Style",
  variant: "Variant",
  release: "Release",
  competition: "Competition",
  country: "Country",
  confederation: "Confederation",
  technology: "Technology",
  brand: "Brand",
  collaboration: "Collaboration",
  size: "Size",
  sleeves: "Sleeves",
  person: "Person",
  print: "Print",
  nameset: "Nameset",
  patch: "Patch",
  packaging: "Packaging",
  signature: "Signature",
  notes: "Notes"
};

// ===== CONFIGURACIÓN NAVEGACION =====
export const NAVIGATION = {
  categories: {
    "Apparel": ["Jersey", "Hoodie", "Jacket", "Pants", "Headwear", "Scarf"],
    "Equipment": ["Boots", "Ball"],
    "Merchandise": ["Drinkware", "Display", "Accessory", "Stationery", "Currency", "Pass", "Photo"]
  }
};

// ===== CONFIGURACIÓN GENERAL ITEM =====

// ===== valores no válidos =====
export function valid(value) {
  return value && value.trim() !== "-" && value.trim() !== "";
}
// caracter con el que se separan valores multiples
export const VALUE_SEPARATOR = "/";
// 🔥 campos que NO se separan con
export const NO_SPLIT_FIELDS = ["Display Name", "ID", "Notes"];

// 🔥 campos ocultos en details
export const HIDDEN_FIELDS = [
  "ID",
  "Display Name",
  "Variant",
  "Category",
  "Entity",
  "Nameset",
  "Sleeves",
  "Collaboration",
  "Notes"
];

// 🔥 reglas especiales de combinación
export const FIELD_COMBINATIONS = {
  "Print": (item, value) => {
    if (valid(item["Nameset"])) {
      return `${value} (${item["Nameset"]} Nameset)`;
    }
    return value;
  },
  "Style": (item, value) => {
    if (valid(item["Sleeves"]) && item["Sleeves"] !== "Short") {
      return `${value} (${item["Sleeves"]} Sleeves)`;
    }
    return value;
  },
  "Brand": (item, value) => {
    if (valid(item["Collaboration"])) {
      return `${value} x ${item["Collaboration"]}`;
    }
    return value;
  }
};

// 🔥 reglas de visibilidad
export const FIELD_VISIBILITY_RULES = {
  "Release": (item, value) => valid(value) && value !== "Regular"
};

// 🔥 breadcrumbs
export const BREADCRUMB_KEY = "Entity";

export const breadcrumbConfig = {
  "National Team": ["Team"],
  "Collective": ["Team"],
  "Club": ["Team"],
  "Event": ["Competition"],
  "Brand": ["Brand"],
  "Person": ["Person"]
};

export const NAVIGATION_BREADCRUMB = ["Category", "Product"];

// 🔥 resolver dinámico
export const BREADCRUMB_RESOLVER = (context) => {
  const { item, filtersState, data, matchField, breadcrumbConfig } = context;

  const keyName = BREADCRUMB_KEY;

  // ===== CASO ITEM =====
  if (item) {
    const key = item[keyName];
    return breadcrumbConfig[key] || null;
  }

  // ===== CASO INDEX =====
  if (filtersState) {

    // 🔥 PRIORIDAD: navegación (category/product)
    if (filtersState.category?.length) {
      return NAVIGATION_BREADCRUMB;
    }

    // 1. entity directo
    if (filtersState.entity?.length) {
      return breadcrumbConfig[filtersState.entity[0]];
    }

    // 2. inferencia
    const possibleEntities = new Set();

    data.forEach(entry => {

      const matches = Object.entries(filtersState).every(([key, values]) => {
        if (!values.length) return true;

        const itemKey = key.charAt(0).toUpperCase() + key.slice(1);
        return matchField(entry[itemKey], values, itemKey);
      });

      if (matches && entry["Entity"]) {
        possibleEntities.add(entry["Entity"]);
      }

    });

    if (possibleEntities.size === 1) {
      return breadcrumbConfig[[...possibleEntities][0]];
    }
  }
  // 🔥 fallback: usar keys activas directamente
  const activeKeys = Object.entries(filtersState)
    .filter(([_, values]) => values.length > 0)
    .map(([key]) => key);

  if (activeKeys.length === 1) {
    return [activeKeys[0].charAt(0).toUpperCase() + activeKeys[0].slice(1)];
  }
  // 🔥 CRÍTICO
  return null;
};


// ===== CONFIGURACIÓN GENERAL INDEX =====
// filtros breadcrumb
export const FILTER_KEYS = [
  "category",
  "product",
  "entity",
  "season",
  "team",
  "country",
  "competition",
  "brand",
  "person",
  "confederation"
];


export const SIDEBAR_KEYS = [
  "team-type",
  "confederation",
  "country",
  "competition",
  "team",
  "season",
  "style",
  "release",
  "brand",
  "technology",
  "size",
  "details"
];
export const CUSTOM_FILTERS = {
  "team-type": { // 🔥 key limpia (sin espacios)
    label: "Team Type", // 👈 lo que se muestra
    getValues: (item) => {
      const entity = item["Entity"];

      if (!entity) return [];

      if (["Club"].includes(entity)) return ["Club"];
      if (["National Team"].includes(entity)) return ["National Team"];
      if (["Collective"].includes(entity)) return ["Collective"];

      return [];
    }
  }
};
export const DETAILS_FILTERS = {
  "Long Sleeves": (item) => valid(item["Sleeves"]) && item["Sleeves"] === "Long",
  "Printed": (item) => valid(item["Print"]),
  "With Patches": (item) => valid(item["Patch"]),
  "Signed": (item) => valid(item["Signature"]),
  "In Box": (item) => valid(item["Packaging"]),
  "Collaboration": (item) => valid(item["Collaboration"])
};

export const SEARCH_KEYS = [
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