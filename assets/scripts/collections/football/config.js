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
    .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1));

  if (activeKeys.length) {
    return activeKeys;
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