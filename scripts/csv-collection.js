import fs from "fs";
import { parse } from "csv-parse/sync";

const collection = process.argv[2];

if (!collection) {
  console.error("❌ You must provide a collection name");
  process.exit(1);
}

const config = {
  football: {
    input: "src/data/csv_files/football_collection - Collection.csv",
    output: "src/data/json_files/football_collection - Collection.json"
  },
  music: {
    input: "src/data/csv_files/music_collection - Collection.csv",
    output: "src/data/json_files/music_collection - Collection.json"
  }
};

if (!config[collection]) {
  console.error(`❌ Unknown collection: ${collection}`);
  process.exit(1);
}

const { input, output } = config[collection];

// 📥 Read CSV
const csv = fs.readFileSync(input, "utf-8");

// 🔄 Parse
const records = parse(csv, {
  columns: true,
  skip_empty_lines: true,
  trim: true
});

// 📤 Save JSON
fs.writeFileSync(output, JSON.stringify(records, null, 2));

console.log(`✅ Collection JSON generated: ${output}`);