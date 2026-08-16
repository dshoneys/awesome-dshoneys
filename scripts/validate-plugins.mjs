import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const catalogPath = resolve(root, "data/plugins.json");
const allowedCategories = new Set([
  "productivity",
  "development",
  "data",
  "local",
  "other",
]);
const allowedStatuses = new Set(["passed", "warning"]);
const requiredTextFields = ["id", "name", "version", "url", "description", "category"];

const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const plugins = catalog.plugins;

if (!Array.isArray(plugins)) {
  throw new TypeError("data/plugins.json 的 plugins 必须是数组。");
}

const ids = new Set();

for (const [index, plugin] of plugins.entries()) {
  const location = `plugins[${index}]`;

  for (const field of requiredTextFields) {
    if (typeof plugin[field] !== "string" || !plugin[field].trim()) {
      throw new TypeError(`${location}.${field} 必须是非空字符串。`);
    }
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(plugin.id)) {
    throw new Error(`${location}.id 只能包含小写字母、数字和单个连字符分隔。`);
  }

  if (ids.has(plugin.id)) {
    throw new Error(`插件 ID 重复：${plugin.id}`);
  }
  ids.add(plugin.id);

  if (!allowedCategories.has(plugin.category)) {
    throw new Error(`${location}.category 不是支持的分类。`);
  }

  if (!plugin.author || typeof plugin.author.name !== "string" || !plugin.author.name.trim()) {
    throw new TypeError(`${location}.author.name 必须是非空字符串。`);
  }

  if (!plugin.security || !allowedStatuses.has(plugin.security.status)) {
    throw new Error(`${location}.security.status 必须为 passed 或 warning。`);
  }

  if (plugin.security.provider !== "dsh.so") {
    throw new Error(`${location}.security.provider 必须为 dsh.so。`);
  }

  for (const [field, value] of [
    ["security.reportUrl", plugin.security.reportUrl],
    ["dshUrl", plugin.dshUrl],
  ]) {
    let url;
    try {
      url = new URL(value);
    } catch {
      throw new TypeError(`${location}.${field} 必须是有效网址。`);
    }

    if (!["dsh.so", "www.dsh.so"].includes(url.hostname.toLowerCase())) {
      throw new Error(`${location}.${field} 必须指向 dsh.so。`);
    }
  }

  if (!new URL(plugin.dshUrl).pathname.startsWith("/zh/plugins/")) {
    throw new Error(`${location}.dshUrl 必须是 dsh.so 中文插件详情页。`);
  }

  if (!Array.isArray(plugin.tags) || plugin.tags.some((tag) => typeof tag !== "string")) {
    throw new TypeError(`${location}.tags 必须是字符串数组。`);
  }

  if (plugin.details !== undefined && (typeof plugin.details !== "string" || !plugin.details.trim())) {
    throw new TypeError(`${location}.details 若存在必须是非空字符串。`);
  }

  if (plugin.install !== undefined) {
    if (!plugin.install || typeof plugin.install.summary !== "string" || !plugin.install.summary.trim()) {
      throw new TypeError(`${location}.install.summary 必须是非空字符串。`);
    }
    if (plugin.install.commands !== undefined) {
      if (
        !Array.isArray(plugin.install.commands) ||
        plugin.install.commands.some((item) => typeof item !== "string" || !item.trim())
      ) {
        throw new TypeError(`${location}.install.commands 必须是非空字符串数组。`);
      }
    }
    if (plugin.install.notes !== undefined) {
      if (
        !Array.isArray(plugin.install.notes) ||
        plugin.install.notes.some((item) => typeof item !== "string" || !item.trim())
      ) {
        throw new TypeError(`${location}.install.notes 必须是非空字符串数组。`);
      }
    }
  }
}

console.log(`插件目录验证通过：${plugins.length} 个认证插件。`);
