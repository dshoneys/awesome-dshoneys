import {
  createExternalLink,
  createInternalLink,
  loadMemeCatalog,
  paragraphsFromText,
} from "./catalog.js?v=20260816-b3";

const elements = {
  loading: document.querySelector("#plugin-loading"),
  missing: document.querySelector("#plugin-missing"),
  article: document.querySelector("#plugin-article"),
  breadcrumb: document.querySelector("#plugin-breadcrumb"),
  badges: document.querySelector("#plugin-badges"),
  title: document.querySelector("#plugin-title"),
  meta: document.querySelector("#plugin-meta"),
  description: document.querySelector("#plugin-description"),
  warning: document.querySelector("#plugin-warning"),
  details: document.querySelector("#plugin-details"),
  installCommands: document.querySelector("#install-commands"),
  actions: document.querySelector("#plugin-actions"),
};

function showMissing(message) {
  elements.loading.hidden = true;
  elements.article.hidden = true;
  elements.missing.hidden = false;
  elements.missing.querySelector("p").textContent = message;
  document.title = "未找到展品 · 抽象区";
}

function renderParagraphs(container, text) {
  container.replaceChildren();
  for (const part of paragraphsFromText(text)) {
    const paragraph = document.createElement("p");
    paragraph.textContent = part;
    container.append(paragraph);
  }
}

function renderCommand(command) {
  elements.installCommands.replaceChildren();
  if (!command?.trim()) {
    elements.installCommands.hidden = true;
    return;
  }

  elements.installCommands.hidden = false;
  const row = document.createElement("div");
  row.className = "command-row";

  const pre = document.createElement("pre");
  const code = document.createElement("code");
  code.textContent = command;
  pre.append(code);

  const button = document.createElement("button");
  button.type = "button";
  button.className = "button button-secondary copy-button";
  button.textContent = "复制";
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(command);
      button.textContent = "已复制";
      setTimeout(() => {
        button.textContent = "复制";
      }, 1500);
    } catch {
      button.textContent = "复制失败";
    }
  });

  row.append(pre, button);
  elements.installCommands.append(row);
}

function renderActions(plugin) {
  const actions = [
    createExternalLink("打开原仓库", plugin.url, "button button-refuse"),
  ];

  if (plugin.listingIssue) {
    actions.push(
      createExternalLink("收录通知 Issue", plugin.listingIssue, "button button-secondary button-refuse-ghost"),
    );
  }

  if (plugin.author?.url) {
    actions.push(
      createExternalLink("作者主页", plugin.author.url, "button button-secondary button-refuse-ghost"),
    );
  }

  actions.push(
    createInternalLink("返回抽象区", "./meme.html", "button button-secondary button-refuse-ghost"),
    createInternalLink("正经目录", "./", "button button-secondary button-refuse-ghost"),
  );

  elements.actions.replaceChildren(...actions);
}

function renderPlugin(plugin) {
  const demandTitle = plugin.demandTitle || plugin.name;
  document.title = `${demandTitle} · 抽象区`;
  elements.loading.hidden = true;
  elements.missing.hidden = true;
  elements.article.hidden = false;

  elements.breadcrumb.replaceChildren(
    createInternalLink("抽象区", "./meme.html"),
    document.createTextNode(" / "),
    document.createTextNode(demandTitle),
  );

  const vibe = document.createElement("span");
  vibe.className = "meme-vibe";
  vibe.textContent = plugin.vibe;

  const badge = document.createElement("span");
  badge.className = "security-badge warning meme-badge";
  badge.textContent = "整活 · 勿生产";
  elements.badges.replaceChildren(vibe, badge);

  elements.title.textContent = demandTitle;
  elements.meta.textContent = [
    `展品 ${plugin.name}`,
    `作者 ${plugin.author?.name ?? "未注明"}`,
  ].join(" · ");
  elements.description.textContent = plugin.punchline;
  elements.warning.textContent = plugin.warning;
  renderParagraphs(elements.details, plugin.details || plugin.punchline);
  renderCommand(plugin.install);
  renderActions(plugin);
}

async function main() {
  const id = new URLSearchParams(location.search).get("id")?.trim();
  if (!id) {
    showMissing("缺少展品 id。请从抽象区点击卡片进入。");
    return;
  }

  try {
    const plugins = await loadMemeCatalog();
    const plugin = plugins.find((item) => item.id === id);
    if (!plugin) {
      showMissing(`抽象区没有 id 为「${id}」的展品。`);
      return;
    }
    renderPlugin(plugin);
  } catch (error) {
    console.error(error);
    showMissing("暂时无法载入抽象区目录，请刷新后重试。");
  }
}

main();
