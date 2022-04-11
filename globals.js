const fs = require("fs");

let subscriptions = new Map();
exports.subscriptions = subscriptions;

// Global list of all servers and their queues.
let serverQueues = new Map();
exports.serverQueues = serverQueues;

// Load config data from juke.json
const rawData = fs.readFileSync("juke.json");
const defaultConfigs = {
  volume: 0.2,
  timeout: 15,
};
const fileConfigs = JSON.parse(rawData);
const configs = { ...defaultConfigs, ...fileConfigs };
exports.configs = configs;
