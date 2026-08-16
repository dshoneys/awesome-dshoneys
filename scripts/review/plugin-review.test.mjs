import assert from "node:assert/strict";
import test from "node:test";

import {
  analyzePackageJson,
  decideStatus,
  parseDshPage,
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
  assert.equal(submission.dshUrl, "https://www.dsh.so/zh/plugins/demo-plugin/");
  assert.deepEqual(submission.missing, []);
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
  assert.deepEqual(result.relatedPlugins, ["https://www.dsh.so/zh/plugins/another-ocr/"]);
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
