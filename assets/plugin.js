import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  createExternalLink,
  createInternalLink,
  loadCatalog,
  paragraphsFromText,
} from "./catalog.js?v=20260816-demand";

const elements = {
  loading: document.querySelector("#plugin-loading"),
  missing: document.querySelector("#plugin-missing"),
  article: document.querySelector("#plugin-article"),
  breadcrumb: document.querySelector("#plugin-breadcrumb"),
  badges: document.querySelector("#plugin-badges"),
  title: document.querySelector("#plugin-title"),
  meta: document.querySelector("#plugin-meta"),
  description: document.querySelector("#plugin-description"),
  details: document.querySelector("#plugin-details"),
  installSummary: document.querySelector("#install-summary"),
  installCommands: document.querySelector("#install-commands"),
  installNotes: document.querySelector("#install-notes"),
  feedback: document.querySelector("#plugin-feedback"),
  actions: document.querySelector("#plugin-actions"),
};

function showMissing(message) {
  elements.loading.hidden = true;
  elements.article.hidden = true;
  elements.missing.hidden = false;
  elements.missing.querySelector("p").textContent = message;
  document.title = "未找到插件 · DeepSeek Honeys";
}

function renderParagraphs(container, text) {
  container.replaceChildren();
  for (const part of paragraphsFromText(text)) {
    const paragraph = document.createElement("p");
    paragraph.textContent = part;
    container.append(paragraph);
  }
}

function renderCommands(commands) {
  elements.installCommands.replaceChildren();
  if (!commands?.length) {
    elements.installCommands.hidden = true;
    return;
  }

  elements.installCommands.hidden = false;
  for (const command of commands) {
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
}

function renderNotes(notes) {
  elements.installNotes.replaceChildren();
  if (!notes?.length) {
    elements.installNotes.hidden = true;
    return;
  }

  elements.installNotes.hidden = false;
  const list = document.createElement("ul");
  for (const note of notes) {
    const item = document.createElement("li");
    item.textContent = note;
    list.append(item);
  }
  elements.installNotes.append(list);
}

function renderFeedback(feedback) {
  elements.feedback.replaceChildren();
  if (!feedback?.content) {
    elements.feedback.hidden = true;
    return;
  }

  elements.feedback.hidden = false;
  const quote = document.createElement("blockquote");
  quote.className = "feedback detail-feedback";
  quote.append(`“${feedback.content}”`);
  if (feedback.from) {
    const cite = document.createElement("cite");
    cite.textContent = `— ${feedback.from}`;
    quote.append(cite);
  }
  elements.feedback.append(quote);
}

function renderActions(plugin) {
  const reportLabel =
    plugin.security.provider === "community"
      ? "查看社区复核"
      : "查看 dsh.so 扫描结果";
  elements.actions.replaceChildren(
    createExternalLink(reportLabel, plugin.security.reportUrl, "button button-primary"),
    createExternalLink("打开原仓库", plugin.url, "button button-secondary"),
  );

  if (plugin.dshUrl && plugin.dshUrl !== plugin.security.reportUrl) {
    elements.actions.append(
      createExternalLink("dsh.so 参考页", plugin.dshUrl, "button button-secondary"),
    );
  }

  if (plugin.author?.url) {
    elements.actions.append(
      createExternalLink("作者主页", plugin.author.url, "button button-secondary"),
    );
  }

  elements.actions.append(createInternalLink("返回目录", "./#directory", "button button-secondary"));
}

function renderPlugin(plugin) {
  const demandTitle = plugin.demandTitle || plugin.name;
  document.title = `${demandTitle} · DeepSeek Honeys`;
  elements.loading.hidden = true;
  elements.missing.hidden = true;
  elements.article.hidden = false;

  elements.breadcrumb.replaceChildren(
    createInternalLink("认证插件目录", "./"),
    document.createTextNode(" / "),
    document.createTextNode(demandTitle),
  );

  const category = document.createElement("span");
  category.className = "category-label";
  category.textContent = CATEGORY_LABELS[plugin.category] ?? CATEGORY_LABELS.other;

  const security = document.createElement("span");
  security.className = `security-badge ${plugin.security.status}`;
  security.textContent = STATUS_LABELS[plugin.security.status] ?? plugin.security.status;
  elements.badges.replaceChildren(category, security);

  elements.title.textContent = demandTitle;
  elements.meta.textContent = [
    `方案 ${plugin.name}`,
    `版本 ${plugin.version || "未注明"}`,
    `作者 ${plugin.author?.name ?? "未注明"}`,
    `复核 ${plugin.security.scannedAt || "未注明"}`,
  ].join(" · ");
  elements.description.textContent = plugin.description;
  renderParagraphs(elements.details, plugin.details || plugin.description);

  if (plugin.install) {
    elements.installSummary.textContent = plugin.install.summary;
    renderCommands(plugin.install.commands);
    renderNotes(plugin.install.notes);
  } else {
    elements.installSummary.textContent = "作者尚未提供标准化安装说明，请先打开原仓库 README 查看。";
    elements.installCommands.hidden = true;
    elements.installNotes.hidden = true;
  }

  renderFeedback(plugin.feedback);
  renderActions(plugin);
}

async function main() {
  const id = new URLSearchParams(location.search).get("id")?.trim();
  if (!id) {
    showMissing("缺少插件 id。请从目录页点击卡片进入。");
    return;
  }

  try {
    const plugins = await loadCatalog();
    const plugin = plugins.find((item) => item.id === id);
    if (!plugin) {
      showMissing(`目录中没有 id 为「${id}」的插件。`);
      return;
    }
    renderPlugin(plugin);
  } catch (error) {
    console.error(error);
    showMissing("暂时无法载入插件目录，请刷新后重试。");
  }
}

main();
