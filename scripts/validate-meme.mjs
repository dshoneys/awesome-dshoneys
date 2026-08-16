import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const catalogPath = resolve(root, "data/meme.json");
const requiredTextFields = [
  "id",
  "name",
  "demandTitle",
  "punchline",
  "url",
  "install",
  "warning",
  "vibe",
];

const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const plugins = catalog.plugins;

if (!Array.isArray(plugins)) {
  throw new TypeError("data/meme.json 的 plugins 必须是数组。");
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
    throw new Error(`抽象区 ID 重复：${plugin.id}`);
  }
  ids.add(plugin.id);

  if (!plugin.author || typeof plugin.author.name !== "string" || !plugin.author.name.trim()) {
    throw new TypeError(`${location}.author.name 必须是非空字符串。`);
  }

  try {
    new URL(plugin.url);
  } catch {
    throw new TypeError(`${location}.url 必须是有效网址。`);
  }

  if (!Array.isArray(plugin.tags) || plugin.tags.some((tag) => typeof tag !== "string")) {
    throw new TypeError(`${location}.tags 必须是字符串数组。`);
  }
}

console.log(`抽象区验证通过：${plugins.length} 个整活插件。`);
