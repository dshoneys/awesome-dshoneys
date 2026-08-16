# 安全徽章规范（Badge Spec）

本目录将 [dsh.so](https://www.dsh.so/) 指定为安全检测服务。每枚徽章都必须链接到公开可核验的 dsh.so 插件详情页或扫描结果；社区只负责核验和展示，不自行改写第三方结论。

> dsh.so 是独立社区服务，并非 DeepSeek Honeys 所有。

---

## ① 徽章与收录规则

| 徽章 | 展示条件 | 收录规则 |
| --- | --- | --- |
| `✅ 已通过` | dsh.so 已完成安全扫描，当前结果未显示需要用户注意的实质风险 | 正常收录并链接原始结果 |
| `⚠️ 警告` | dsh.so 已完成扫描，但结果存在应向用户明确披露的风险或限制 | 可谨慎收录，卡片必须直达原始结果 |
| `❌ 不通过` | 结果显示高风险、恶意行为、仓库失效，或结果无法核验 | 不公开展示；已收录条目立即下架 |

`⏳ 待检测` 仅用于 Issue 流转，不是公开徽章。没有 dsh.so 插件详情页和扫描结果的条目不得写入 `data/plugins.json`。

---

## ② 数据填写规范

目录条目的安全字段必须使用：

```json
{
  "security": {
    "provider": "dsh.so",
    "status": "passed",
    "reportUrl": "https://www.dsh.so/zh/plugins/<slug>/",
    "scannedAt": "2026-08-16"
  },
  "dshUrl": "https://www.dsh.so/zh/plugins/<slug>/"
}
```

- `provider` 固定为 `dsh.so`。
- `reportUrl` 必须指向 dsh.so 的公开扫描结果，不接受截图、转述或本地文件代替。
- `dshUrl` 必须是 `https://www.dsh.so/zh/plugins/<slug>/` 形式的中文插件详情页。
- `status` 只能是 `passed` 或 `warning`；不通过的插件不进入公开数据。
- `scannedAt` 填写页面所对应扫描结果的日期。

---

## ③ 映射原则

维护者应以 dsh.so 页面当时公开显示的信息为准，结合安全状态、风险提示和验证信息进行保守映射：

1. 页面必须公开可访问，并与提交的仓库和版本一致。
2. 不得把“已收录”“L1/L2 验证”或“仓库活跃”等同于安全通过。
3. 信息不完整或边界不清时使用 `⚠️ 警告`，不要含糊标为 `✅ 已通过`。
4. dsh.so 结果更新后，以最新公开结果同步调整目录状态。

徽章表示“基于该次公开扫描结果的目录状态”，不构成永久安全保证。

---

## ④ 生命周期

- **版本变化需复核**：插件更新权限、依赖、网络行为或主要代码后，确认 dsh.so 已扫描新版本。
- **结果可升降级**：风险修复后可升级；出现新风险时立即降级或下架。
- **链接失效即撤标**：dsh.so 原始结果无法访问时，条目暂停展示，不能用社区转述替代。
- **保留独立性说明**：页面和文档不得把 dsh.so 表述成社区自有、官方隶属或人工担保服务。

---

---

## ⑤ 收录徽章（供作者挂到 README）

插件被本目录收录后，作者可在仓库 README 挂载下列徽章，链回目录首页或本仓库。安全结论仍以 dsh.so 原文为准；本目录徽章只表示「当前已被 DeepSeek Honeys 收录及目录侧展示状态」。

| 文件 | 含义 | 何时使用 |
| --- | --- | --- |
| [`assets/badges/listed.svg`](../assets/badges/listed.svg) | 已收录 | 任意已公开条目 |
| [`assets/badges/warning.svg`](../assets/badges/warning.svg) | 目录侧为 ⚠️ | `security.status = warning` |
| [`assets/badges/passed.svg`](../assets/badges/passed.svg) | 目录侧为 ✅ | `security.status = passed` |

Markdown 示例（Pages 部署后生效）：

```markdown
[![DeepSeek Honeys](https://dshoneys.github.io/awesome-dshoneys/assets/badges/warning.svg)](https://dshoneys.github.io/awesome-dshoneys/)
```

也可临时使用 shields.io 文本徽章：

```markdown
[![DeepSeek Honeys](https://img.shields.io/badge/DeepSeek%20Honeys-listed-0B6E4F)](https://dshoneys.github.io/awesome-dshoneys/)
```

挂载徽章为自愿；不挂载不影响收录。作者升级版本后，请确认 dsh.so 已重扫，并与维护者同步目录状态。

---

*本规范由 DeepSeek Honeys 社区维护 · 修改请提 PR · 遵循 [MIT License](../LICENSE)*
