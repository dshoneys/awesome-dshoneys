# 贡献指南

感谢参与 DeepSeek Honeys 插件目录。本目录以**社区维护者复核**为主要门槛；[dsh.so](https://www.dsh.so/) 扫描是可选参考信号。

## ① 收录原则（社区优先）

- **社区复核为主**：维护者阅读公开仓库、权限面与披露文案后，决定上架、⚠️ 披露或暂缓。
- **风险必须说清**：有本机进程、出网、凭据、动态加载第三方包等能力时，卡片与反馈字段必须写明。
- **dsh.so 可选**：有可核验详情页时建议附上；没有也可先收录，并在反馈中注明扫描状态。
- **未披露的关键高风险不收录**：隐瞒外发、凭据窃取等行为，不得「先斩后奏」。
- 结论为 ❌ 且作者未修复的条目不下架到公开目录（已上架的会撤下）。

## ② 推荐流程

1. **开 Issue**：用提交模板附上公开仓库、用途、已知权限 / 网络面；可选附 dsh.so 链接。
2. **社区复核**：维护者静态审阅并写复核备注。
3. **写入目录**：在 `data/plugins.json` 追加条目，填 `demandTitle`（首页卡片主标题 = 用户需求描述）。
4. **持续更新**：版本或风险面变化时更新或下架。

## ③ 条目字段

必填示例：

```json
{
  "id": "example-plugin",
  "name": "example-plugin",
  "demandTitle": "一句话描述用户要解决什么",
  "version": "1.0.0",
  "author": { "name": "@author", "url": "https://github.com/author" },
  "url": "https://github.com/author/example-plugin",
  "description": "一句话能力说明。",
  "details": "更完整说明与风险披露。",
  "install": {
    "summary": "怎么装。",
    "commands": ["dsh plugin --profile web add example-plugin"],
    "notes": ["可选注意点"]
  },
  "category": "productivity",
  "security": {
    "provider": "community",
    "status": "warning",
    "reportUrl": "https://github.com/dshoneys/awesome-dshoneys/issues/123",
    "scannedAt": "2026-08-16"
  },
  "tags": ["示例"],
  "dshUrl": "https://www.dsh.so/zh/plugins/example-plugin/",
  "feedback": {
    "content": "社区复核备注。",
    "from": "@维护者，2026-08-16"
  }
}
```

- `demandTitle`：首页与详情页主标题，写需求而不是包名。
- `security.provider`：`community`（社区复核）或 `dsh.so`（以扫描页为主报告）。
- `security.reportUrl`：社区 Issue / 复核记录，或 dsh.so 页面。
- `dshUrl`：可选；存在时须指向 `dsh.so`。
- 公开目录只允许 `passed` / `warning`。

## ④ 提 PR

1. Fork 后编辑 `data/plugins.json`。
2. 本地运行：`node scripts/validate-plugins.mjs`。
3. 按 PR 模板说明需求覆盖、风险披露与复核依据。

欢迎补充「群友实测备注」（注明昵称与日期）。
