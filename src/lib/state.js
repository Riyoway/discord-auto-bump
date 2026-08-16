const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..', '..');
const dataDir = path.join(projectRoot, 'data');

const files = {
  history: path.join(dataDir, 'last-executed.json'),
  trend: path.join(dataDir, 'trend.json'),
  schedule: path.join(dataDir, 'schedule.json')
};

const defaults = {
  history: [],
  trend: { dailyStats: {} },
  schedule: { nextBumpTime: '', randomMinutes: 0 }
};

function ensureDataDir() {
  fs.mkdirSync(dataDir, { recursive: true });
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  ensureDataDir();
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readHistory() {
  const value = readJson(files.history, defaults.history);
  return Array.isArray(value) ? value : [value];
}

function appendHistory(entry) {
  const history = readHistory();
  history.push(entry);
  writeJson(files.history, history);
}

function readTrend() {
  return readJson(files.trend, defaults.trend);
}

function writeTrend(value) {
  writeJson(files.trend, value);
}

function readSchedule() {
  return readJson(files.schedule, defaults.schedule);
}

function writeSchedule(value) {
  writeJson(files.schedule, value);
}

module.exports = { files, readHistory, appendHistory, readTrend, writeTrend, readSchedule, writeSchedule };
