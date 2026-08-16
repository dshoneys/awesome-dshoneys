import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const BOT_MARKER = "<!-- dshoneys-review-bot -->";
const MANAGED_LABELS = new Set([
  "needs-info",
  "scan-blocked",
  "changes-requested",
  "review-ready",
]);
const RESERVED_DSH_PLUGIN_SLUGS = new Set(["compare", "collections"]);

const LABELS = {
  plugin: { color: "0E8A16", description: "插件收录提交" },
  "needs-info": { color: "FBCA04", description: "等待提交者补充必要信息" },
  "scan-blocked": { color: "BFD4F2", description: "等待外部安全扫描结果" },
  "changes-requested": { color: "D93F0B", description: "自动评审发现阻断项，等待整改" },
  "review-ready": { color: "1D76DB", description: "自动门槛已通过，等待最终收录决定" },
  duplicate: { color: "CFDAE6", description: "内容与现有 Issue 重复，已并入主项" },
  "same-category": { color: "5319E7", description: "与其他投稿功能重叠，需统一比较或整合" },
};

const SECTION_ALIASES = {
  name: ["插件名称", "插件名"],
  url: ["插件链接", "仓库链接", "源码链接"],
  description: ["简介", "插件简介"],
  author: ["作者", "插件作者"],
  security: ["dsh.so 检测结果（必填）", "dsh.so 检测结果", "安全检测"],
  version: ["版本与提交", "版本", "目标版本"],
  category: ["分类", "插件分类"],
};

const STATIC_RULES = [
  {
    id: "dynamic-eval",
    severity: "critical",
    regex: /\b(?:eval\s*\(|new\s+Function\s*\()/,
    message: "发现动态代码执行。",
  },
  {
    id: "shell-mode",
    severity: "critical",
    regex: /\bshell\s*:\s*true\b/,
    message: "子进程启用了 shell 模式。",
  },
  {
    id: "child-process",
    severity: "warning",
    regex: /\b(?:child_process|node:child_process|execSync|execFileSync|spawnSync|execFile|spawn)\b/,
    message: "插件可以启动本地进程，需要人工确认参数和清理逻辑。",
  },
  {
    id: "network",
    severity: "warning",
    regex: /\b(?:fetch\s*\(|axios\b|WebSocket\b|https?\.request|node:https?|XMLHttpRequest)\b/,
    message: "插件包含网络访问能力，需要核对目标地址和发送数据。",
  },
  {
    id: "credential-access",
    severity: "warning",
    regex: /\b(?:process\.env|dotenv|credential|api[_-]?key|access[_-]?token|cookie)\b/i,
    message: "插件可能访问配置、凭据或环境变量。",
  },
  {
    id: "filesystem-write",
    severity: "warning",
    regex: /\b(?:writeFile|appendFile|createWriteStream|rmSync|unlinkSync|rmdirSync|renameSync)\b/,
    message: "插件包含文件写入或删除能力，需要核对作用范围。",
  },
  {
    id: "download-execute",
    severity: "critical",
    regex: /\b(?:curl|wget|Invoke-WebRequest)\b.*(?:\||&&|;).*\b(?:sh|bash|pwsh|powershell|node|python)\b/i,
    message: "发现下载后执行模式。",
  },
];

function cleanSection(value = "") {
  return value
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/^\s*[-*]\s*\[[ xX]\]\s*/gm, "")
    .trim();
}

export function parseSections(body = "") {
  const sections = new Map();
  const headings = [...body.matchAll(/^##\s+(.+?)\s*$/gm)];

  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index];
    const start = heading.index + heading[0].length;
    const end = headings[index + 1]?.index ?? body.length;
    sections.set(heading[1].trim(), cleanSection(body.slice(start, end)));
  }

  const result = {};
  for (const [key, aliases] of Object.entries(SECTION_ALIASES)) {
    const entry = [...sections.entries()].find(([heading]) =>
      aliases.some((alias) => heading.toLocaleLowerCase("zh-CN") === alias.toLocaleLowerCase("zh-CN")),
    );
    result[key] = entry?.[1] ?? "";
  }

  return result;
}

export function extractUrls(value = "") {
  return [...value.matchAll(/https?:\/\/[^\s<>()\]]+/g)].map((match) =>
    match[0].replace(/[.,，。；;]+$/, ""),
  );
}

export function parseGitHubRepository(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.toLowerCase() !== "github.com") return null;
    const [owner, repository] = parsed.pathname.split("/").filter(Boolean);
    if (!owner || !repository) return null;
    return { owner, repository: repository.replace(/\.git$/i, "") };
  } catch {
    return null;
  }
}

/** Accept /zh/plugins|/plugins|/artifact slug pages; normalize to Chinese plugin detail URL. */
export function normalizeDshPluginUrl(url) {
  try {
    const parsed = new URL(url);
    if (!["dsh.so", "www.dsh.so"].includes(parsed.hostname.toLowerCase())) return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    let slug = null;
    if (parts[0] === "zh" && parts[1] === "plugins" && parts[2]) slug = parts[2];
    else if (parts[0] === "plugins" && parts[1]) slug = parts[1];
    else if (parts[0] === "artifact" && parts[1]) slug = parts[1];
    if (!slug || !/^[a-z0-9][a-z0-9-]*$/i.test(slug)) return null;
    return `https://www.dsh.so/zh/plugins/${slug.toLowerCase()}/`;
  } catch {
    return null;
  }
}

export function parseSubmission(issue) {
  const sections = parseSections(issue.body ?? "");
  const pluginUrl = extractUrls(sections.url).find((url) => parseGitHubRepository(url));
  const securityUrls = extractUrls(sections.security);
  const dshUrl = securityUrls.map(normalizeDshPluginUrl).find(Boolean) ?? null;

  const missing = [];
  if (!sections.name) missing.push("插件名称");
  if (!pluginUrl) missing.push("公开 GitHub 仓库链接");
  if (!sections.description) missing.push("简介");
  if (!sections.author) missing.push("作者");
  if (!dshUrl) missing.push("dsh.so 插件详情页");

  return {
    issueNumber: issue.number,
    name: sections.name.split("\n")[0]?.trim() ?? "",
    description: sections.description,
    author: sections.author.split("\n")[0]?.trim() ?? "",
    version: sections.version.split("\n")[0]?.trim() ?? "",
    category: sections.category.split("\n")[0]?.trim() ?? "",
    pluginUrl,
    repository: pluginUrl ? parseGitHubRepository(pluginUrl) : null,
    dshUrl,
    missing,
  };
}

function htmlToText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function parseDshPage(html, url) {
  const text = htmlToText(html);
  const riskFromClass = html.match(/\b(low|medium|high)-risk\b/i)?.[1]?.toLowerCase() ?? null;
  const riskFromZh = text.match(/(高风险|中风险|低风险)/)?.[1] ?? null;
  const riskFromEn = text.match(/\bSecurity\b[^A-Za-z]{0,24}\b(Low|Medium|High)\b/i)?.[1]?.toLowerCase() ?? null;
  const risk =
    riskFromClass ??
    (riskFromZh === "高风险"
      ? "high"
      : riskFromZh === "中风险"
        ? "medium"
        : riskFromZh === "低风险"
          ? "low"
          : null) ??
    (riskFromEn === "high" ? "high" : riskFromEn === "medium" ? "medium" : riskFromEn === "low" ? "low" : null);

  const critical = Number(
    text.match(/\bcritical\s*(\d+)/i)?.[1] ??
      text.match(/(\d+)\s*严重/)?.[1] ??
      text.match(/严重\s*(\d+)/)?.[1] ??
      0,
  );
  const warning = Number(
    text.match(/\bwarning\s*(\d+)/i)?.[1] ??
      text.match(/(\d+)\s*警告/)?.[1] ??
      text.match(/警告\s*(\d+)/)?.[1] ??
      0,
  );
  const scanDate =
    text.match(/扫描时间\s*[:：]?\s*(\d{4}-\d{2}-\d{2})/)?.[1] ??
    text.match(/扫描版本[^0-9]{0,40}(\d{4}-\d{2}-\d{2})/)?.[1] ??
    text.match(/scanned commit[^0-9]{0,40}(\d{4}-\d{2}-\d{2})/i)?.[1] ??
    null;
  const scanVersion = text.match(/扫描版本\s*[:：]?\s*([^\s]+|—)/)?.[1] ?? null;
  const currentVersion = text.match(/当前版本\s*[:：]?\s*([^\s]+|—)/)?.[1] ?? null;
  const passedBadge = /已通过|\bPASSED\b/i.test(text) || /自动化扫描未发现严重/.test(text);
  const currentPath = new URL(url).pathname.replace(/\/+$/, "");
  const relatedPlugins = [
    ...new Set(
      [...html.matchAll(/href=["'](?:https:\/\/www\.dsh\.so)?(\/zh\/plugins\/[a-z0-9-]+\/?)["']/gi)]
        .map((match) => match[1].replace(/\/+$/, ""))
        .filter((path) => path !== currentPath)
        .filter((path) => !RESERVED_DSH_PLUGIN_SLUGS.has(path.split("/").filter(Boolean).at(-1)))
        .map((path) => `https://www.dsh.so${path}/`),
    ),
  ].slice(0, 6);

  return {
    url,
    reachable: true,
    verification: text.includes("未验证") ? "未验证" : "已验证或未标注",
    risk: risk ?? (passedBadge ? "low" : null),
    critical,
    warning,
    scanDate,
    scanVersion,
    currentVersion,
    relatedPlugins,
    hasSecurityResult: Boolean(risk || passedBadge || scanDate || /严重|critical/i.test(text)),
  };
}

export function scanSourceFiles(files) {
  const findings = [];

  for (const file of files) {
    const lines = file.content.split(/\r?\n/);
    lines.forEach((line, index) => {
      for (const rule of STATIC_RULES) {
        if (rule.regex.test(line)) {
          findings.push({
            id: rule.id,
            severity: rule.severity,
            path: file.path,
            line: index + 1,
            message: rule.message,
          });
        }
      }
    });
  }

  const unique = new Map();
  for (const finding of findings) {
    const key = `${finding.id}:${finding.path}:${finding.line}`;
    unique.set(key, finding);
  }
  return [...unique.values()];
}

export function analyzePackageJson(content, treePaths) {
  const findings = [];
  let packageJson;
  try {
    packageJson = JSON.parse(content);
  } catch {
    return [
      {
        id: "invalid-package-json",
        severity: "critical",
        path: "package.json",
        line: 1,
        message: "package.json 不是有效 JSON。",
      },
    ];
  }

  const scripts = packageJson.scripts ?? {};
  for (const name of ["preinstall", "install", "postinstall"]) {
    if (scripts[name]) {
      findings.push({
        id: `install-script-${name}`,
        severity: "critical",
        path: "package.json",
        line: 1,
        message: `安装时自动执行 ${name}: ${scripts[name]}`,
      });
    }
  }
  if (scripts.prepare) {
    findings.push({
      id: "prepare-script",
      severity: "warning",
      path: "package.json",
      line: 1,
      message: `Git 安装会执行 prepare: ${scripts.prepare}`,
    });
  }

  const hasLockfile = treePaths.some((path) =>
    ["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lock", "bun.lockb"].includes(path),
  );
  if (!hasLockfile) {
    findings.push({
      id: "missing-lockfile",
      severity: "warning",
      path: "package.json",
      line: 1,
      message: "没有提交依赖锁文件，安装结果不可完全复现。",
    });
  }

  if (packageJson.name && !packageJson.name.startsWith("@")) {
    findings.push({
      id: "unscoped-package-name",
      severity: "warning",
      path: "package.json",
      line: 1,
      message: `包名 ${packageJson.name} 未使用 scope，需要核对 npm 同名包冲突。`,
    });
  }

  return findings;
}

export function decideStatus({ submission, dsh, repository, findings }) {
  if (submission.missing.length) {
    return {
      label: "needs-info",
      title: "材料不完整",
      next: `请补充：${submission.missing.join("、")}。`,
    };
  }

  if (!repository?.reachable) {
    return {
      label: "needs-info",
      title: "源码仓库无法核验",
      next: "请确认仓库为公开状态且链接正确。",
    };
  }

  if (!dsh?.reachable || !dsh.hasSecurityResult) {
    return {
      label: "scan-blocked",
      title: "等待 dsh.so 安全扫描",
      next: "dsh.so 页面尚无可核验扫描结果；结果更新后回复 `/recheck`。",
    };
  }

  const criticalFindings = findings.filter((finding) => finding.severity === "critical");
  if (dsh.risk === "high" || dsh.critical > 0 || criticalFindings.length > 0) {
    return {
      label: "changes-requested",
      title: "发现阻断项",
      next: "请先修复 high/critical 风险并让 dsh.so 扫描新 commit，然后回复 `/recheck`。",
    };
  }

  return {
    label: "review-ready",
    title: "自动门槛已通过",
    next: "已进入同类检索与最终评级队列；该状态不等于正式收录。",
  };
}

function escapeMarkdown(value = "") {
  return value.replace(/[|]/g, "\\|").replace(/\r?\n/g, " ").trim();
}

function renderFindings(findings) {
  if (!findings.length) return "未命中内置高风险规则。";
  const priority = { critical: 0, warning: 1, info: 2 };
  return findings
    .sort((a, b) => priority[a.severity] - priority[b.severity])
    .slice(0, 12)
    .map(
      (finding) =>
        `- **${finding.severity.toUpperCase()}** \`${finding.path}:${finding.line}\`：${finding.message}`,
    )
    .join("\n");
}

export function renderReport({ submission, dsh, repository, findings, decision }) {
  const reportPayload = JSON.stringify({
    commit: repository?.commit ?? null,
    dsh,
    findings,
    label: decision.label,
    missing: submission.missing,
  });
  const hash = createHash("sha256").update(reportPayload).digest("hex").slice(0, 12);

  return `${BOT_MARKER}
<!-- report-hash:${hash} -->
## 自动评审：${decision.title}

| 项目 | 结果 |
| --- | --- |
| 投稿 | ${escapeMarkdown(submission.name || "未填写")} |
| 源码 | ${submission.pluginUrl ? `[公开仓库](${submission.pluginUrl})` : "未提供"} |
| 固定提交 | ${repository?.commit ? `\`${repository.commit}\`` : "无法获取"} |
| dsh.so | ${submission.dshUrl ? `[扫描页面](${submission.dshUrl})` : "未提供"} |
| 外部风险 | ${dsh?.risk ? `${dsh.risk}-risk` : "暂无结果"}；critical ${dsh?.critical ?? 0}；warning ${dsh?.warning ?? 0} |
| 仓库状态 | ${repository?.summary ?? "无法核验"} |
| 当前状态 | \`${decision.label}\` |

### 自动证据

${renderFindings(findings)}

### 公开同类候选

${
  dsh?.relatedPlugins?.length
    ? dsh.relatedPlugins.map((url) => `- ${url}`).join("\n")
    : "dsh.so 当前页面未提供可解析的同类候选；最终评级时仍需补充检索。"
}

### 下一步

${decision.next}

> 自动评审只读取固定 commit，不执行投稿插件，也不会把模型判断当作安全保证。正式展示以最终评级和收录 PR 为准。
`;
}

async function githubApi(path, token, options = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "dshoneys-plugin-review",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`GitHub API ${response.status} ${path}: ${message.slice(0, 500)}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

async function ensureLabels(repository, token) {
  for (const [name, config] of Object.entries(LABELS)) {
    const response = await fetch(`https://api.github.com/repos/${repository}/labels`, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "dshoneys-plugin-review",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({ name, ...config }),
    });
    if (!response.ok && response.status !== 422) {
      throw new Error(`无法创建标签 ${name}: ${response.status} ${await response.text()}`);
    }
  }
}

async function fetchDshResult(url) {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "dshoneys-plugin-review/1.0" },
      redirect: "follow",
    });
    if (!response.ok) return { url, reachable: false, hasSecurityResult: false };
    return parseDshPage(await response.text(), url);
  } catch {
    return { url, reachable: false, hasSecurityResult: false };
  }
}

function shouldInspectPath(path, size) {
  if (size > 120_000) return false;
  if (/^(?:src|scripts|lib|test|tests)\//.test(path) && /\.(?:[cm]?[jt]sx?|py|sh|ps1)$/i.test(path)) {
    return true;
  }
  return /^(?:package\.json|cordis\.patch\.ya?ml|dsh\.config\.[cm]?[jt]s|README\.md)$/i.test(path);
}

async function fetchRepositoryEvidence(submission, token) {
  if (!submission.repository) return { reachable: false, files: [], findings: [] };
  const { owner, repository } = submission.repository;

  try {
    const metadata = await githubApi(`/repos/${owner}/${repository}`, token);
    const commit = await githubApi(
      `/repos/${owner}/${repository}/commits/${encodeURIComponent(metadata.default_branch)}`,
      token,
    );
    const tree = await githubApi(
      `/repos/${owner}/${repository}/git/trees/${commit.sha}?recursive=1`,
      token,
    );
    const entries = (tree.tree ?? []).filter((item) => item.type === "blob");
    const selected = entries.filter((item) => shouldInspectPath(item.path, item.size ?? 0)).slice(0, 45);
    const files = [];
    let totalBytes = 0;

    for (const item of selected) {
      if (totalBytes >= 800_000) break;
      const blob = await githubApi(`/repos/${owner}/${repository}/git/blobs/${item.sha}`, token);
      if (blob.encoding !== "base64") continue;
      const content = Buffer.from(blob.content.replace(/\s/g, ""), "base64").toString("utf8");
      totalBytes += Buffer.byteLength(content);
      files.push({ path: item.path, content });
    }

    const findings = scanSourceFiles(files);
    const packageFile = files.find((file) => file.path === "package.json");
    if (packageFile) {
      findings.push(...analyzePackageJson(packageFile.content, entries.map((entry) => entry.path)));
    }

    const hasReadme = entries.some((entry) => /^readme(?:\.[^.]+)?$/i.test(entry.path));
    const hasLicense = entries.some((entry) => /^(?:license|copying)(?:\.[^.]+)?$/i.test(entry.path));
    const hasTests = entries.some((entry) => /^(?:test|tests)\//.test(entry.path));
    const hasWorkflow = entries.some((entry) => /^\.github\/workflows\//.test(entry.path));

    return {
      reachable: true,
      commit: commit.sha,
      files,
      findings,
      summary: [
        metadata.archived ? "已归档" : "活跃仓库",
        hasReadme ? "README" : "缺 README",
        hasLicense ? "有许可证" : "缺许可证",
        hasTests ? "有测试" : "缺测试",
        hasWorkflow ? "有 CI" : "缺 CI",
      ].join("；"),
    };
  } catch (error) {
    console.error(error.message);
    return { reachable: false, files: [], findings: [], summary: "源码仓库无法读取" };
  }
}

async function updateIssueState({ repository, issue, decision, report, token }) {
  const existingLabels = (issue.labels ?? []).map((label) =>
    typeof label === "string" ? label : label.name,
  );
  const labels = existingLabels.filter((label) => !MANAGED_LABELS.has(label));
  if (!labels.includes("plugin")) labels.push("plugin");
  labels.push(decision.label);

  await githubApi(`/repos/${repository}/issues/${issue.number}/labels`, token, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ labels: [...new Set(labels)] }),
  });

  const comments = await githubApi(
    `/repos/${repository}/issues/${issue.number}/comments?per_page=100`,
    token,
  );
  const existing = comments.find(
    (comment) =>
      comment.user?.login === "github-actions[bot]" && comment.body?.includes(BOT_MARKER),
  );

  if (existing?.body === report) return;
  if (existing) {
    await githubApi(`/repos/${repository}/issues/comments/${existing.id}`, token, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: report }),
    });
  } else {
    await githubApi(`/repos/${repository}/issues/${issue.number}/comments`, token, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: report }),
    });
  }
}

async function reviewIssue({ repository, issue, token }) {
  if (issue.state && issue.state !== "open") return;
  const labels = (issue.labels ?? []).map((label) => (typeof label === "string" ? label : label.name));
  if (!labels.includes("plugin") && !issue.title?.startsWith("[交插件]")) return;
  if (labels.includes("duplicate")) return;

  const submission = parseSubmission(issue);
  const dsh = submission.dshUrl
    ? await fetchDshResult(submission.dshUrl)
    : { reachable: false, hasSecurityResult: false };
  const repositoryEvidence = await fetchRepositoryEvidence(submission, token);
  const findings = repositoryEvidence.findings ?? [];
  const decision = decideStatus({
    submission,
    dsh,
    repository: repositoryEvidence,
    findings,
  });
  const report = renderReport({
    submission,
    dsh,
    repository: repositoryEvidence,
    findings,
    decision,
  });

  await updateIssueState({
    repository,
    issue,
    decision,
    report,
    token,
  });
  console.log(`Reviewed issue #${issue.number}: ${decision.label}`);
}

async function getIssuesFromEvent({ event, repository, token }) {
  if (event.issue) {
    if (event.comment) {
      if (event.comment.body?.trim() !== "/recheck") return [];
      const association = event.comment.author_association;
      const allowed =
        event.comment.user?.login === event.issue.user?.login ||
        ["OWNER", "MEMBER", "COLLABORATOR"].includes(association);
      if (!allowed) return [];
    }
    return [event.issue];
  }

  const inputIssue = process.env.INPUT_ISSUE_NUMBER?.trim();
  if (inputIssue) {
    return [await githubApi(`/repos/${repository}/issues/${inputIssue}`, token)];
  }

  return githubApi(`/repos/${repository}/issues?state=open&labels=plugin&per_page=100`, token);
}

async function main() {
  const token = process.env.GH_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!token || !repository || !eventPath) {
    throw new Error("缺少 GH_TOKEN、GITHUB_REPOSITORY 或 GITHUB_EVENT_PATH。");
  }

  const event = JSON.parse(await readFile(eventPath, "utf8"));
  await ensureLabels(repository, token);
  const issues = await getIssuesFromEvent({ event, repository, token });

  for (const issue of issues) {
    await reviewIssue({ repository, issue, token });
  }
}

if (process.argv[1]?.endsWith("plugin-review.mjs")) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
