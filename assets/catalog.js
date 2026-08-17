export const CATEGORY_LABELS = {
  productivity: "效率工具",
  development: "开发工具",
  data: "数据接入",
  local: "本地化",
  other: "其他",
};

export const PLATFORM_LABELS = {
  windows: "Windows",
  linux: "Linux",
  macos: "macOS",
};

export const STATUS_LABELS = {
  passed: "✓ 已通过",
  warning: "⚠ 有警告",
};

/** Default catalog platform for first-time visitors. */
export const DEFAULT_PLATFORM = "windows";

export function formatPlatforms(platforms) {
  if (!Array.isArray(platforms) || !platforms.length) return "";
  const known = ["windows", "linux", "macos"];
  if (known.every((p) => platforms.includes(p))) return "全平台";
  return platforms.map((p) => PLATFORM_LABELS[p] ?? p).join(" · ");
}

export function getPluginPageUrl(pluginOrId) {
  const id = typeof pluginOrId === "string" ? pluginOrId : pluginOrId?.id;
  if (!id) return "./";
  return `./plugin.html?id=${encodeURIComponent(id)}`;
}

export function getMemePageUrl(pluginOrId) {
  const id = typeof pluginOrId === "string" ? pluginOrId : pluginOrId?.id;
  if (!id) return "./meme.html";
  return `./meme-plugin.html?id=${encodeURIComponent(id)}`;
}

export function normalize(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase("zh-CN")
    .trim();
}

export function createExternalLink(text, href, className) {
  const link = document.createElement("a");
  link.textContent = text;
  link.href = href;
  link.target = "_blank";
  link.rel = "noreferrer";
  if (className) link.className = className;
  return link;
}

export function createInternalLink(text, href, className) {
  const link = document.createElement("a");
  link.textContent = text;
  link.href = href;
  if (className) link.className = className;
  return link;
}

export async function loadCatalog() {
  const response = await fetch(`./data/plugins.json?t=${Date.now()}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return Array.isArray(data.plugins) ? data.plugins : [];
}

export async function loadMemeCatalog() {
  const response = await fetch(`./data/meme.json?t=${Date.now()}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return Array.isArray(data.plugins) ? data.plugins : [];
}

export function paragraphsFromText(text) {
  return String(text ?? "")
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}
