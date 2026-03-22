const fs = require("fs");
const { parse } = require("csv-parse/sync");

const collection = process.argv[2];

const config = {
  football: {
    input: "data/football_collection - Collection.csv",
    output: "football/football_collection.json"
  }
};

const { input, output } = config[collection];

// Read CSV
const csv = fs.readFileSync(input, "utf-8");

// Proper parsing
const records = parse(csv, {
  columns: true,
  skip_empty_lines: true,
  trim: true
});

// Save JSON
fs.writeFileSync(output, JSON.stringify(records, null, 2));

console.log("Done");