# 贡献指南：如何把插件提交进目录

欢迎为 **DeepSeek Honeys 插件目录（awesome-dshoneys）** 贡献插件条目、实测反馈与文档改进。本指南面向「交插件 / 修条目」的 PR 提交流程；求插件请走 Issue 需求墙（见 [README.md](README.md) ④）。

---

## ① 硬规则：未检测不收录

**未经安全检测的插件，不会进入本目录。**

- 这是本目录唯一不可协商的硬规则。没有检测报告 → 没有安全徽章 → 条目不合入 README 目录，没有例外。
- 哪怕插件再好用、群里再多人推荐、作者再大牌，只要还没出检测报告，目录中就不会出现它的条目。
- 提交 PR 时若插件尚未检测，**PR 依然欢迎**：你先提交条目草稿，检测完成后由维护者补上徽章与报告链接，再合并入库。
- 结论为 ❌ 不通过、且作者未在合理期限内修复的插件，同样不收录（已在目录中的会被下架）。

---

## ② 安全检测流程

提交（PR 或 Issue）之后，由**社区安全检测助手**按 [docs/security-report-template.md](docs/security-report-template.md) 出具标准化报告：

1. **提交**：你交插件并在 PR / Issue 中勾选「同意安全检测」声明（见 `.github/ISSUE_TEMPLATE/submit-plugin.md`）。
2. **检测**：安全检测助手逐项检查五类风险——权限滥用、恶意代码、数据外传、密钥窃取、依赖风险，记录复现方式、检测日期与检测者，给出结论分级：**通过 / 警告 / 不通过**。
3. **先私聊、后公示（避免误伤）**：检测中一旦发现任何风险点，**不会直接公开挂人**——检测助手会先私聊插件作者，说明问题细节、给出修复建议；作者修复并复检确认后，才对外公示结论与报告。确属恶意的除外。
4. **打标**：依据结论打上安全徽章（✅ 通过 / ⚠️ 警告 / ❌ 不通过，样式与判定标准见 [docs/badge-spec.md](docs/badge-spec.md)）。
5. **归档**：检测报告存放于 `docs/reports/`，目录条目与报告一一对应，长期可查。

---

### dsh.so 安全扫描（建议项，规则与作者确认中）

建议先到 [dsh.so 提交页](https://www.dsh.so/zh/submit/) 提交插件。收录后在 PR 中附上：

1. **dsh.so 插件条目链接（含 slug）**：`https://www.dsh.so/zh/plugins/<slug>/`
2. **dsh.so 扫描报告/扫描结果链接**：插件详情页的扫描结论，或 [dsh.so 安全周报](https://www.dsh.so/zh/security-reports/)

与 dsh.so 作者确认最终规则前，以上为建议提供项；社区自检报告继续有效，两者并行。

## ③ 条目字段要求

在线目录的数据统一保存在 [`data/plugins.json`](data/plugins.json)，结构由
[`data/plugins.schema.json`](data/plugins.schema.json) 约束。每个条目至少包含：

- 插件唯一 ID、名称、版本、作者与公开链接
- 一到两句话的功能简介和所属分类
- 安全等级、检测日期与检测报告链接
- 用于搜索的标签；必要时可添加同义词或拼音关键词
- 可选的群友实测反馈和 dsh.so 页面

仅允许 `passed`（通过）和 `warning`（警告）进入公开目录；未检测条目应先通过 Issue 或 PR 描述提交，检测完成后再写入 `plugins.json`。

新增条目示例：

```json
{
  "id": "plugin-slug",
  "name": "插件名称",
  "version": "v1.0.0",
  "author": {
    "name": "@author",
    "url": "https://github.com/author"
  },
  "url": "https://github.com/author/plugin",
  "description": "一句话说明插件解决的问题。",
  "category": "development",
  "security": {
    "status": "passed",
    "reportUrl": "./docs/reports/plugin-slug.md",
    "scannedAt": "2026-08-16"
  },
  "tags": ["自动化", "开发工具"],
  "searchTerms": ["automation"],
  "feedback": {
    "content": "真实使用反馈",
    "from": "@群友，2026-08"
  }
}
```

---

## ④ PR 步骤（四步走）

1. **Fork** 本仓库到你的账号，clone 到本地。
2. **准备条目与报告**：按照安全报告模板完成检测，把报告放入 `docs/reports/`，并在 `data/plugins.json` 中追加条目。
3. **按 [PULL_REQUEST_TEMPLATE.md](PULL_REQUEST_TEMPLATE.md) 填写** PR 描述：插件名、插件链接、简介、作者、是否已过安全检测（是|否，若否则等待检测）、群友实测反馈，一项不落。
4. **提交 PR，等待检测与 review**：维护者会核对数据、徽章与报告链接；合并后 GitHub Pages 会自动更新在线目录。

---

## 其他贡献方式

- **报告坏链 / 反馈问题**：直接提 Issue 或在群里 @维护者。
- **补充实测备注**：对已收录插件有真实使用体验，欢迎提 PR 修改「群友实测备注」字段（注明昵称与日期）。
- **文档与模板改进**：检测模板、徽章规范、周报模板的合理修改建议均欢迎 PR。

有任何不清楚的，群里 @维护者，别客气。

本仓库由 DeepSeek Honeys 微信群社区共建 · 遵循 [MIT License](LICENSE)
