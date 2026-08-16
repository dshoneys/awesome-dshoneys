import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const catalogPath = resolve(root, "data/plugins.json");
const allowedCategories = new Set(["productivity", "development", "data", "other"]);
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

  if (
    typeof plugin.security.reportUrl !== "string" ||
    !plugin.security.reportUrl.startsWith("./docs/reports/")
  ) {
    throw new Error(`${location}.security.reportUrl 必须指向 ./docs/reports/ 下的报告。`);
  }

  const reportPath = resolve(root, plugin.security.reportUrl.replace(/^\.\//, ""));
  await access(reportPath);

  if (!Array.isArray(plugin.tags) || plugin.tags.some((tag) => typeof tag !== "string")) {
    throw new TypeError(`${location}.tags 必须是字符串数组。`);
  }
}

console.log(`插件目录验证通过：${plugins.length} 个认证插件。`);
