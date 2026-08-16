# 贡献指南：如何把插件提交进目录

欢迎为 **DeepSeek Honeys 插件目录（awesome-dshoneys）** 贡献插件条目、实测反馈与文档改进。本指南面向「交插件 / 修条目」的 PR 提交流程；求插件请走 Issue 需求墙（见 [README.md](README.md) ④）。

---

## ① 硬规则：未检测不收录

**未经安全检测的插件，不会进入本目录。**

- 这是本目录唯一不可协商的硬规则。没有 dsh.so 扫描结果 → 没有安全徽章 → 不进入公开目录，没有例外。
- 哪怕插件再好用、群里再多人推荐、作者再大牌，只要还没有 dsh.so 结果，目录中就不会出现它的条目。
- 尚未检测时可以先提 Issue 交流；完成 dsh.so 检测并补齐链接后，再进入合并与展示流程。
- 结论为 ❌ 不通过、且作者未在合理期限内修复的插件，同样不收录（已在目录中的会被下架）。

---

## ② 安全检测流程

本目录将 [dsh.so](https://www.dsh.so/) 指定为安全检测服务，正确顺序是先检测、后申请收录：

1. **提交检测**：到 [dsh.so 提交页](https://www.dsh.so/zh/submit/) 粘贴插件的公开仓库地址。
2. **等待结果**：取得 `https://www.dsh.so/zh/plugins/<slug>/` 插件详情页和可核验的安全扫描结果。
3. **申请收录**：通过 Issue 或 PR 同时提交插件信息、dsh.so 详情页和扫描结果链接。
4. **社区核验**：维护者确认链接、版本与结果一致，按 [徽章规范](docs/badge-spec.md) 映射展示状态。
5. **持续更新**：插件版本或 dsh.so 结果发生变化时，重新核验并更新、降级或下架。

---

### dsh.so 安全扫描（必填）

申请收录必须提供：

1. **dsh.so 插件条目链接（含 slug）**：`https://www.dsh.so/zh/plugins/<slug>/`
2. **dsh.so 扫描结果链接**：插件详情页展示的安全结论或对应的公开报告链接

缺少任一链接时可以先提 Issue 交流，但不会写入 `data/plugins.json` 或公开展示。dsh.so 是独立服务，社区只核验和引用其结果。

## ③ 条目字段要求

在线目录的数据统一保存在 [`data/plugins.json`](data/plugins.json)，结构由
[`data/plugins.schema.json`](data/plugins.schema.json) 约束。每个条目至少包含：

- 插件唯一 ID、名称、版本、作者与公开链接
- 一到两句话的功能简介和所属分类
- 建议补充 `details`（详情介绍）与 `install`（安装摘要、命令、注意事项），用于独立展示页
- 固定为 `dsh.so` 的检测服务字段、安全等级、检测日期与扫描结果链接
- 用于搜索的标签；必要时可添加同义词或拼音关键词
- 可选的群友实测反馈和 dsh.so 页面

仅允许 `passed`（通过）和 `warning`（警告）进入公开目录；未取得 dsh.so 结果的条目应先通过 Issue 交流，完成检测后再写入 `plugins.json`。

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
  "details": "更完整的介绍，可用空行分段。",
  "install": {
    "summary": "推荐安装方式一句话说明。",
    "commands": ["dsh plugin --profile web add github:author/plugin"],
    "notes": ["重启 dsh web 后刷新页面验证。"]
  },
  "category": "development",
  "security": {
    "provider": "dsh.so",
    "status": "passed",
    "reportUrl": "https://www.dsh.so/zh/plugins/plugin-slug/",
    "scannedAt": "2026-08-16"
  },
  "tags": ["自动化", "开发工具"],
  "searchTerms": ["automation"],
  "dshUrl": "https://www.dsh.so/zh/plugins/plugin-slug/",
  "feedback": {
    "content": "真实使用反馈",
    "from": "@群友，2026-08"
  }
}
```

独立展示页地址为 `plugin.html?id=<插件id>`；目录卡片只进入该页，外链按钮放在详情页内。
---

## ④ PR 步骤（四步走）

1. **Fork** 本仓库到你的账号，clone 到本地。
2. **准备检测结果**：先取得 dsh.so 插件详情页与扫描结果，再在 `data/plugins.json` 中追加条目。
3. **按 [PULL_REQUEST_TEMPLATE.md](PULL_REQUEST_TEMPLATE.md) 填写** PR 描述：插件名、插件链接、简介、作者、是否已过安全检测（是|否，若否则等待检测）、群友实测反馈，一项不落。
4. **提交 PR，等待检测与 review**：维护者会核对数据、徽章与报告链接；合并后 GitHub Pages 会自动更新在线目录。

---

## 其他贡献方式

- **报告坏链 / 反馈问题**：直接提 Issue 或在群里 @维护者。
- **补充实测备注**：对已收录插件有真实使用体验，欢迎提 PR 修改「群友实测备注」字段（注明昵称与日期）。
- **文档与模板改进**：检测模板、徽章规范、周报模板的合理修改建议均欢迎 PR。

有任何不清楚的，群里 @维护者，别客气。

本仓库由 DeepSeek Honeys 微信群社区共建 · 遵循 [MIT License](LICENSE)
