const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadJSON(filename, defaultValue = []) {
  const filePath = path.join(DATA_DIR, filename);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
  return defaultValue;
}

function saveJSON(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// In-memory stores backed by JSON files
const store = {
  projects: loadJSON('projects.json', []),
  tm: loadJSON('tm.json', []),
  glossary: loadJSON('glossary.json', []),

  saveProjects() {
    saveJSON('projects.json', this.projects);
  },
  saveTM() {
    saveJSON('tm.json', this.tm);
  },
  saveGlossary() {
    saveJSON('glossary.json', this.glossary);
  },
};

module.exports = store;
