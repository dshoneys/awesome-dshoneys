import assert from "node:assert/strict";
import test from "node:test";

import {
  analyzePackageJson,
  classifySurface,
  decideStatus,
  normalizeDshPluginUrl,
  parseDshPage,
  parsePublishedPrefixes,
  parseSubmission,
  scanSourceFiles,
} from "./plugin-review.mjs";

const issue = {
  number: 7,
  title: "[交插件] demo",
  body: `## 插件名称

demo-plugin

## 插件链接

https://github.com/example/demo-plugin

## 简介

用于测试自动评审。

## 作者

@example

## dsh.so 检测结果（必填）

- dsh.so 插件详情页：https://www.dsh.so/zh/plugins/demo-plugin/
- [x] 我确认链接公开可访问
`,
};

test("解析标准投稿模板", () => {
  const submission = parseSubmission(issue);
  assert.equal(submission.name, "demo-plugin");
  assert.equal(submission.pluginUrl, "https://github.com/example/demo-plugin");
  assert.equal(submission.repository.owner, "example");
  assert.equal(submission.repository.repository, "demo-plugin");
  assert.equal(submission.dshUrl, "https://www.dsh.so/zh/artifact/demo-plugin/");
  assert.deepEqual(submission.missing, []);
});

test("接受 plugins / artifact 详情页并规范化为 zh/artifact", () => {
  assert.equal(
    normalizeDshPluginUrl("https://www.dsh.so/artifact/dsh-plugins-finder/"),
    "https://www.dsh.so/zh/artifact/dsh-plugins-finder/",
  );
  assert.equal(
    normalizeDshPluginUrl("https://www.dsh.so/zh/plugins/dsh-plugins-finder/"),
    "https://www.dsh.so/zh/artifact/dsh-plugins-finder/",
  );
  const submission = parseSubmission({
    ...issue,
    body: issue.body.replace(
      "https://www.dsh.so/zh/plugins/demo-plugin/",
      "https://www.dsh.so/artifact/demo-plugin/",
    ),
  });
  assert.equal(submission.dshUrl, "https://www.dsh.so/zh/artifact/demo-plugin/");
  assert.deepEqual(submission.missing, []);
});

test("识别中文安全页的通过态与计数", () => {
  const html = `
    <main>
      <div>已通过</div>
      <p>自动化扫描未发现严重或警告级问题。</p>
      <span><strong>0</strong> 严重</span>
      <span><strong>0</strong> 警告</span>
      <span><strong>2</strong> 提示</span>
      <p>扫描版本 — 2026-08-16</p>
    </main>
  `;
  const result = parseDshPage(html, "https://www.dsh.so/zh/plugins/demo-plugin/");
  assert.equal(result.hasSecurityResult, true);
  assert.equal(result.risk, "low");
  assert.equal(result.critical, 0);
  assert.equal(result.warning, 0);
  assert.equal(result.scanDate, "2026-08-16");
});

test("识别 dsh.so 风险和扫描数据", () => {
  const html = `
    <main>
      <span>未验证</span><strong>high-risk</strong>
      <div>critical 2 warning 3</div>
      <p>扫描版本: abc123</p><p>当前版本: abc123</p>
      <p>扫描时间: 2026-08-16</p>
      <a href="/zh/plugins/compare/">compare</a>
      <a href="/zh/plugins/collections/">collections</a>
      <a href="/zh/plugins/another-ocr/">another</a>
    </main>
  `;
  const result = parseDshPage(html, "https://www.dsh.so/zh/plugins/demo-plugin/");
  assert.equal(result.risk, "high");
  assert.equal(result.critical, 2);
  assert.equal(result.warning, 3);
  assert.equal(result.scanDate, "2026-08-16");
  assert.equal(result.hasSecurityResult, true);
  assert.deepEqual(result.relatedPlugins, ["https://www.dsh.so/zh/artifact/another-ocr/"]);
});

test("静态规则返回文件与行号", () => {
  const findings = scanSourceFiles([
    {
      path: "src/index.ts",
      content: 'import { exec } from "node:child_process";\nconst value = eval(input);\n',
    },
  ]);
  assert.ok(findings.some((finding) => finding.id === "child-process" && finding.line === 1));
  assert.ok(findings.some((finding) => finding.id === "dynamic-eval" && finding.line === 2));
});

test("包配置识别安装脚本和缺少锁文件", () => {
  const findings = analyzePackageJson(
    JSON.stringify({
      name: "demo-plugin",
      scripts: { postinstall: "node install.js", prepare: "npm run build" },
    }),
    ["package.json"],
  );
  assert.ok(findings.some((finding) => finding.id === "install-script-postinstall"));
  assert.ok(findings.some((finding) => finding.id === "missing-lockfile"));
  assert.ok(findings.some((finding) => finding.id === "unscoped-package-name"));
});

test("files 白名单归一化为路径前缀", () => {
  assert.deepEqual(
    parsePublishedPrefixes(
      JSON.stringify({
        files: ["lib", "./rescue/", "packages/agent-team/lib/**/*", "assets/*.svg", "!lib/dev"],
      }),
    ),
    ["lib", "rescue", "packages/agent-team/lib", "assets"],
  );
  assert.equal(parsePublishedPrefixes(JSON.stringify({ name: "demo" })), null);
});

test("未随包发布的开发脚本归入仓库面", () => {
  const prefixes = ["lib", "cordis.patch.yml"];
  assert.equal(classifySurface("scripts/build-client.mjs", prefixes), "repository");
  assert.equal(classifySurface("tests/e2e.mjs", prefixes), "repository");
  assert.equal(classifySurface("lib/index.js", prefixes), "published");
  // 编译产物才进包时，源码仍按发布面计算。
  assert.equal(classifySurface("src/index.ts", prefixes), "published");
  // 没有 files 白名单就无法证明未发布，保守按发布面处理。
  assert.equal(classifySurface("scripts/build-client.mjs", null), "published");
});

test("仓库开发脚本里的 critical 不阻断", () => {
  const submission = parseSubmission(issue);
  const dsh = { reachable: true, hasSecurityResult: true, risk: "low", critical: 0 };
  const repository = { reachable: true };

  assert.equal(
    decideStatus({
      submission,
      dsh,
      repository,
      findings: [{ severity: "critical", surface: "repository" }],
    }).label,
    "review-ready",
  );
  assert.equal(
    decideStatus({
      submission,
      dsh,
      repository,
      findings: [{ severity: "critical", surface: "published" }],
    }).label,
    "changes-requested",
  );
});

test("高风险扫描进入整改状态", () => {
  const submission = parseSubmission(issue);
  const decision = decideStatus({
    submission,
    dsh: {
      reachable: true,
      hasSecurityResult: true,
      risk: "high",
      critical: 2,
    },
    repository: { reachable: true },
    findings: [],
  });
  assert.equal(decision.label, "changes-requested");
});

test("全部自动门槛通过后进入最终评审", () => {
  const submission = parseSubmission(issue);
  const decision = decideStatus({
    submission,
    dsh: {
      reachable: true,
      hasSecurityResult: true,
      risk: "low",
      critical: 0,
    },
    repository: { reachable: true },
    findings: [{ severity: "warning" }],
  });
  assert.equal(decision.label, "review-ready");
});
