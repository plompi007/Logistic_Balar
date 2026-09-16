const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_FILE = path.join(__dirname, '..', 'data', 'submissions.json');

function ensureFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
  }
}

function readAll() {
  ensureFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeAll(items) {
  ensureFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2), 'utf8');
}

function create(submission) {
  const items = readAll();
  const record = {
    id: crypto.randomUUID(),
    submittedAt: new Date().toISOString(),
    ...submission,
  };
  items.push(record);
  writeAll(items);
  return record;
}

function remove(id) {
  const items = readAll();
  const next = items.filter((i) => i.id !== id);
  writeAll(next);
  return next.length !== items.length;
}

module.exports = { readAll, writeAll, create, remove };
