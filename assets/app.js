const CATEGORY_LABELS = {
  productivity: "效率工具",
  development: "开发工具",
  data: "数据接入",
  other: "其他",
};

const STATUS_LABELS = {
  passed: "✓ 已通过",
  warning: "⚠ 有警告",
};

const state = {
  plugins: [],
  query: "",
  category: "all",
  status: "all",
  loadFailed: false,
};

const elements = {
  grid: document.querySelector("#plugin-grid"),
  empty: document.querySelector("#empty-state"),
  emptyTitle: document.querySelector("#empty-title"),
  emptyDescription: document.querySelector("#empty-description"),
  count: document.querySelector("#result-count"),
  search: document.querySelector("#search-input"),
  status: document.querySelector("#status-select"),
  categoryButtons: [...document.querySelectorAll("[data-category]")],
  clear: document.querySelector("#clear-filters"),
};

function normalize(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase("zh-CN")
    .trim();
}

function getSearchText(plugin) {
  return normalize(
    [
      plugin.name,
      plugin.version,
      plugin.author?.name,
      plugin.description,
      CATEGORY_LABELS[plugin.category],
      ...(plugin.tags ?? []),
      ...(plugin.searchTerms ?? []),
      plugin.feedback?.content,
    ].join(" "),
  );
}

function matchesSearch(plugin) {
  const terms = normalize(state.query).split(/\s+/).filter(Boolean);
  if (!terms.length) return true;

  const text = getSearchText(plugin);
  return terms.every((term) => text.includes(term));
}

function getFilteredPlugins() {
  return state.plugins.filter((plugin) => {
    const categoryMatches = state.category === "all" || plugin.category === state.category;
    const statusMatches = state.status === "all" || plugin.security?.status === state.status;
    return categoryMatches && statusMatches && matchesSearch(plugin);
  });
}

function createLink(text, href, className) {
  const link = document.createElement("a");
  link.textContent = text;
  link.href = href;
  link.target = "_blank";
  link.rel = "noreferrer";
  if (className) link.className = className;
  return link;
}

function createPluginCard(plugin) {
  const card = document.createElement("article");
  card.className = "plugin-card";

  const top = document.createElement("div");
  top.className = "card-top";

  const category = document.createElement("span");
  category.className = "category-label";
  category.textContent = CATEGORY_LABELS[plugin.category] ?? CATEGORY_LABELS.other;

  const security = document.createElement("span");
  security.className = `security-badge ${plugin.security.status}`;
  security.textContent = STATUS_LABELS[plugin.security.status] ?? plugin.security.status;
  top.append(category, security);

  const title = document.createElement("h3");
  title.append(createLink(plugin.name, plugin.url));

  const author = document.createElement("p");
  author.className = "author";
  author.append("作者：");
  if (plugin.author?.url) {
    author.append(createLink(plugin.author.name, plugin.author.url));
  } else {
    author.append(plugin.author?.name ?? "未注明");
  }

  const description = document.createElement("p");
  description.className = "description";
  description.textContent = plugin.description;

  const tags = document.createElement("div");
  tags.className = "tags";
  (plugin.tags ?? []).forEach((item) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = item;
    tags.append(tag);
  });

  card.append(top, title, author, description, tags);

  if (plugin.feedback?.content) {
    const feedback = document.createElement("blockquote");
    feedback.className = "feedback";
    feedback.append(`“${plugin.feedback.content}”`);
    if (plugin.feedback.from) {
      const cite = document.createElement("cite");
      cite.textContent = `— ${plugin.feedback.from}`;
      feedback.append(cite);
    }
    card.append(feedback);
  }

  const footer = document.createElement("div");
  footer.className = "card-footer";

  const links = document.createElement("span");
  links.className = "card-links";
  links.append(createLink("安全报告", plugin.security.reportUrl));
  if (plugin.dshUrl) {
    links.append(" · ", createLink("dsh.so", plugin.dshUrl));
  }
  links.append(" · ", createLink("查看插件 →", plugin.url));

  const version = document.createElement("span");
  version.className = "version";
  version.textContent = plugin.version || "";
  footer.append(links, version);
  card.append(footer);

  return card;
}

function updateUrl() {
  const params = new URLSearchParams();
  if (state.query) params.set("q", state.query);
  if (state.category !== "all") params.set("category", state.category);
  if (state.status !== "all") params.set("status", state.status);

  const query = params.toString();
  history.replaceState(null, "", `${location.pathname}${query ? `?${query}` : ""}${location.hash}`);
}

function render() {
  const plugins = getFilteredPlugins();
  elements.grid.replaceChildren(...plugins.map(createPluginCard));

  const hasFilters = Boolean(state.query) || state.category !== "all" || state.status !== "all";
  elements.empty.hidden = plugins.length > 0;
  elements.grid.hidden = plugins.length === 0;

  if (!state.plugins.length) {
    elements.count.textContent = "等待首批认证插件";
    elements.emptyTitle.textContent = "目录正在等待第一批认证插件";
    elements.emptyDescription.textContent = "提交插件并通过安全检测后，它会以卡片形式展示在这里。";
    elements.clear.textContent = "提交插件";
  } else {
    elements.count.textContent = hasFilters
      ? `找到 ${plugins.length} / ${state.plugins.length} 个插件`
      : `共收录 ${state.plugins.length} 个插件`;
    elements.emptyTitle.textContent = "没有找到匹配的插件";
    elements.emptyDescription.textContent = "换个关键词或筛选条件试试。";
    elements.clear.textContent = "清除筛选";
  }

  updateUrl();
}

function setCategory(category) {
  state.category = category;
  elements.categoryButtons.forEach((button) => {
    const isActive = button.dataset.category === category;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function resetFilters() {
  if (state.loadFailed) {
    window.open(
      "https://github.com/dshoneys/awesome-dshoneys",
      "_blank",
      "noopener,noreferrer",
    );
    return;
  }

  if (!state.plugins.length) {
    window.open(
      "https://github.com/dshoneys/awesome-dshoneys/issues/new/choose",
      "_blank",
      "noopener,noreferrer",
    );
    return;
  }

  state.query = "";
  state.status = "all";
  elements.search.value = "";
  elements.status.value = "all";
  setCategory("all");
  render();
}

function readInitialFilters() {
  const params = new URLSearchParams(location.search);
  const category = params.get("category");
  const status = params.get("status");

  state.query = params.get("q") ?? "";
  state.category = Object.hasOwn(CATEGORY_LABELS, category) ? category : "all";
  state.status = Object.hasOwn(STATUS_LABELS, status) ? status : "all";

  elements.search.value = state.query;
  elements.status.value = state.status;
  setCategory(state.category);
}

function bindEvents() {
  elements.search.addEventListener("input", (event) => {
    state.query = event.target.value;
    render();
  });

  elements.status.addEventListener("change", (event) => {
    state.status = event.target.value;
    render();
  });

  elements.categoryButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setCategory(button.dataset.category);
      render();
    });
  });

  elements.clear.addEventListener("click", resetFilters);

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
    if (event.key === "/" && !isTyping) {
      event.preventDefault();
      elements.search.focus();
    }
    if (event.key === "Escape" && document.activeElement === elements.search) {
      elements.search.value = "";
      state.query = "";
      elements.search.blur();
      render();
    }
  });
}

async function loadPlugins() {
  try {
    const response = await fetch("./data/plugins.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    state.plugins = Array.isArray(data.plugins) ? data.plugins : [];
    render();
  } catch (error) {
    console.error("无法载入插件目录：", error);
    state.loadFailed = true;
    elements.count.textContent = "目录载入失败";
    elements.empty.hidden = false;
    elements.grid.hidden = true;
    elements.emptyTitle.textContent = "暂时无法载入插件目录";
    elements.emptyDescription.textContent = "请刷新页面重试，或前往 GitHub 仓库查看。";
    elements.clear.textContent = "打开 GitHub";
  }
}

readInitialFilters();
bindEvents();
loadPlugins();
