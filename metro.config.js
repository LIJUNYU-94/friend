// metro.config.js
const { getDefaultConfig } = require("@expo/metro-config");

const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push("cjs"); // ← 既存なら重複不要
config.resolver.unstable_enablePackageExports = false; // ← ★これを追加
module.exports = config;
