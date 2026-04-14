import fs from "fs";
import { parse } from "csv-parse/sync";

const lists = process.argv[2];

if (!lists) {
  console.error("❌ You must provide a list name");
  process.exit(1);
}

const config = {
  football: {
    input: "src/data/csv_files/football_collection - Lists.csv",
    output: "src/data/json_files/football_collection - Lists.json"
  }
};

if (!config[lists]) {
  console.error(`❌ Unknown list: ${lists}`);
  process.exit(1);
}

const { input, output } = config[lists];

// 📥 Read CSV
const csv = fs.readFileSync(input, "utf-8");

// 🔄 Parse inicial (filas)
const records = parse(csv, {
  columns: true,
  skip_empty_lines: true,
  trim: true
});

// 🏗️ Transformar de Filas a Columnas
// Si el CSV está vacío, generamos un objeto vacío
const columnsData = {};

if (records.length > 0) {
  // Obtenemos los nombres de las columnas de las llaves del primer registro
  const columnNames = Object.keys(records[0]);

  columnNames.forEach(col => {
    // Para cada columna, extraemos todos sus valores y filtramos vacíos si es necesario
    columnsData[col] = records
      .map(row => row[col])
      .filter(value => value !== "" && value !== null); // Opcional: limpiar celdas vacías
  });
}

// 📤 Save JSON
fs.writeFileSync(output, JSON.stringify(columnsData, null, 2));

console.log(`✅ Lists JSON generated: ${output}`);