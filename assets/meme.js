import {
  createInternalLink,
  getMemePageUrl,
  loadMemeCatalog,
} from "./catalog.js?v=20260816-b3";

const ATTEMPT_KEY = "dshoneys-meme-attempts";
const ATTEMPT_MAX = 3;

const elements = {
  grid: document.querySelector("#meme-grid"),
  empty: document.querySelector("#meme-empty"),
  count: document.querySelector("#meme-count"),
  attempt: document.querySelector("#refusal-attempt"),
  date: document.querySelector("#refusal-date"),
  stego: document.querySelector("#footer-stego"),
};

function stegoDate(hit) {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return hit ? `${y}/${m}/${day}` : `${y}-${m}-${day}`;
}

function bumpAttempt() {
  let n = Number(sessionStorage.getItem(ATTEMPT_KEY) || "0");
  if (!Number.isFinite(n) || n < 0) n = 0;
  n = Math.min(n + 1, ATTEMPT_MAX + 2);
  sessionStorage.setItem(ATTEMPT_KEY, String(n));
  return n;
}

function renderAttempt(n) {
  const capped = Math.min(n, ATTEMPT_MAX);
  const zh =
    n >= ATTEMPT_MAX
      ? `（第 ${capped}/${ATTEMPT_MAX} 次尝试——会话本可结束，但我们是静态站，只能继续让你逛。）`
      : `（第 ${capped}/${ATTEMPT_MAX} 次尝试——继续浏览将加深抽象程度）`;
  const en =
    n >= ATTEMPT_MAX
      ? `(Attempt ${capped}/${ATTEMPT_MAX} — chat would have ended. This is a static site, so here we are.)`
      : `(Attempt ${capped}/${ATTEMPT_MAX} — further browsing will increase absurdity.)`;
  elements.attempt.innerHTML = `${zh}<br /><span class="refusal-attempt-en">${en}</span>`;
}

async function copyText(text, button) {
  try {
    await navigator.clipboard.writeText(text);
    const prev = button.textContent;
    button.textContent = "已复制";
    window.setTimeout(() => {
      button.textContent = prev;
    }, 1400);
  } catch {
    button.textContent = "失败";
  }
}

function createCard(plugin) {
  const detailUrl = getMemePageUrl(plugin);
  const card = document.createElement("article");
  card.className = "meme-card";
  card.tabIndex = 0;
  card.setAttribute("role", "link");
  card.setAttribute("aria-label", `查看展品：${plugin.demandTitle}`);
  card.addEventListener("click", (event) => {
    if (event.target.closest("a, button")) return;
    location.href = detailUrl;
  });
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      location.href = detailUrl;
    }
  });

  const top = document.createElement("div");
  top.className = "card-top";

  const vibe = document.createElement("span");
  vibe.className = "meme-vibe";
  vibe.textContent = plugin.vibe;

  const badge = document.createElement("span");
  badge.className = "security-badge warning meme-badge";
  badge.textContent = "整活 · 勿生产";
  top.append(vibe, badge);

  const demand = document.createElement("p");
  demand.className = "demand-label";
  demand.textContent = "荒诞需求";

  const title = document.createElement("h3");
  title.className = "demand-title";
  title.append(createInternalLink(plugin.demandTitle || plugin.name, detailUrl));

  const author = document.createElement("p");
  author.className = "author";
  author.textContent = `展品：${plugin.name} · ${plugin.author?.name ?? "匿名整活"}`;

  const punchline = document.createElement("p");
  punchline.className = "meme-punchline";
  punchline.textContent = plugin.punchline;

  const warning = document.createElement("p");
  warning.className = "meme-warning";
  warning.textContent = plugin.warning;

  const tags = document.createElement("div");
  tags.className = "tags";
  (plugin.tags ?? []).forEach((item) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = item;
    tags.append(tag);
  });

  const installBlock = document.createElement("div");
  installBlock.className = "meme-install";

  const installLabel = document.createElement("p");
  installLabel.className = "meme-install-label";
  installLabel.textContent = "安装（自负）";

  const row = document.createElement("div");
  row.className = "command-row";

  const pre = document.createElement("pre");
  const code = document.createElement("code");
  code.textContent = plugin.install;
  pre.append(code);

  const copy = document.createElement("button");
  copy.type = "button";
  copy.className = "button button-secondary copy-button";
  copy.textContent = "复制";
  copy.addEventListener("click", (event) => {
    event.stopPropagation();
    copyText(plugin.install, copy);
  });

  row.append(pre, copy);
  installBlock.append(installLabel, row);

  const footer = document.createElement("div");
  footer.className = "card-footer";
  footer.append(createInternalLink("查看展品 →", detailUrl, "card-links"));

  card.append(top, demand, title, author, punchline, warning, tags, installBlock, footer);
  return card;
}

async function loadMeme() {
  const date = stegoDate(true);
  elements.date.textContent = date;
  elements.stego.textContent = `隐写玩笑：今天写作 ${date}（斜杠 = 你已进入目标区域）。`;

  const attempt = bumpAttempt();
  renderAttempt(attempt);

  try {
    const plugins = await loadMemeCatalog();
    elements.grid.replaceChildren(...plugins.map(createCard));
    elements.empty.hidden = plugins.length > 0;
    elements.grid.hidden = plugins.length === 0;
    elements.count.textContent =
      plugins.length > 0 ? `共 ${plugins.length} 件展品 · 均不可供职` : "空空如也";
  } catch (error) {
    console.error("无法载入抽象区：", error);
    elements.count.textContent = "载入失败（也挺抽象）";
    elements.empty.hidden = false;
    elements.grid.hidden = true;
  }
}

loadMeme();
