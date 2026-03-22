const fs = require("fs");

// Get argument (football, music, etc.)
const collection = process.argv[2];

if (!collection) {
  console.log("You must specify a collection");
  console.log("Example: node scripts/csv-to-json.js football");
  process.exit(1);
}

// Collection configuration
const config = {
  football: {
    input: "data/football_collection - Collection.csv",
    output: "football/football_collection.json"
  }
};

// Validate collection
if (!config[collection]) {
  console.log(`Invalid collection: ${collection}`);
  process.exit(1);
}

const { input, output } = config[collection];

// Read CSV file
const csv = fs.readFileSync(input, "utf-8");

// Process lines
const lines = csv.split("\n").filter(line => line.trim() !== "");
const headers = lines[0].split(",").map(h => h.trim());

// Convert to JSON
const data = lines.slice(1).map(line => {
  const values = line.split(",");
  let obj = {};

  headers.forEach((header, i) => {
    obj[header] = values[i] ? values[i].trim() : "";
  });

  return obj;
});

// Save JSON file
fs.writeFileSync(output, JSON.stringify(data, null, 2));

console.log(`${collection} updated -> ${output}`);