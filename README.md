# Personal Collections Archive

A modular web application designed to manage, filter, and explore personal digital collections. This project focuses on high performance, clean navigation, and a responsive user experience.

## Key Features

* **Dynamic Collection Management:** A centralized configuration system that allows for easy scaling and addition of new collections.
* **Smart Search Engine:** * Real-time predictive search using debouncing for optimal performance.
* Support for custom filters and attribute-based searching.
* Instant preview of search results and suggested categories.


* **Responsive Design:** Fully adaptive layout with native dark/light mode support and dynamic accent color injection.
* **Hierarchical Navigation:** A robust system for organizing and browsing large datasets through parent-child relationships.
* **Optimized UI:** Built with accessible, mobile-first components to ensure compatibility across all devices.

## Tech Stack

* **Frontend:** React with TypeScript.
* **Routing:** React Router (state management via URL parameters).
* **Styling:** Tailwind CSS.
* **Icons:** Lucide React.
* **Components:** Custom UI components optimized for accessibility.

## Getting Started

1. **Clone the repository:**
```bash
git clone https://github.com/Everardo-shain/collections.git

```


2. **Install dependencies:**
```bash
npm install

```


3. **Start the development server:**
```bash
npm run dev

```



## Configuration

The system is powered by a central `config.ts` file. New collections can be added by defining:

* **Metadata:** Titles, logos, and specific accent colors.
* **Data:** Source data structures.
* **Search/Filter Keys:** Definitions for searchable attributes and suggestion logic.

## Workflow

Run the following commands:

* **Update collection data:** npm run csv-collection football
* **Update collection list:** npm run csv-lists football
* **Process raw images:** npm run images:optimize