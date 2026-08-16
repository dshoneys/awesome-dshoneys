# 安全徽章规范

本目录以**社区维护者复核**映射公开徽章；[dsh.so](https://www.dsh.so/) 为可选参考。社区不把第三方扫描表述为官方担保。

## ① 徽章与收录

| 徽章 | 展示条件 | 收录规则 |
| --- | --- | --- |
| `✅ 已通过` | 社区复核未发现需用户特别注意的实质风险；或 dsh.so 结论干净且与源码一致 | 正常收录 |
| `⚠️ 警告` | 存在应披露的能力或限制（进程、出网、凭据、第三方桥等），或 dsh.so 有需注意项 | 可收录，卡片必须写清风险 |
| `❌ 不通过` | 未披露的关键高风险、恶意行为、仓库失效，或复核无法建立最低信任 | 不公开展示；已收录立即下架 |

`⏳ 待检测` 仅用于 Issue 流转，不是公开徽章。

## ② 数据字段

```json
{
  "demandTitle": "用户需求描述（卡片主标题）",
  "security": {
    "provider": "community",
    "status": "warning",
    "reportUrl": "https://github.com/dshoneys/awesome-dshoneys/issues/123",
    "scannedAt": "2026-08-16"
  },
  "dshUrl": "https://www.dsh.so/zh/artifact/<slug>/"
}
```

- `provider`：`community` 或 `dsh.so`。
- `reportUrl`：社区复核入口（Issue）或 dsh.so 公开页；须可点击核验。
- `dshUrl`：可选；若填写优先 `https://www.dsh.so/zh/artifact/<slug>/`（`/plugins/` 为早期路径，投稿时也会被规范到 artifact）。

## ③ 映射原则

1. 以源码与披露为准；dsh.so 结论冲突时，目录侧宁可更保守（升 ⚠️ 或暂缓）。
2. 不得把「已收录」「L1/L2 验证」或「仓库活跃」等同于安全通过。
3. dsh.so 结果更新后，同步复核目录状态。
4. 隐瞒关键路径的投稿，即使功能再热也不收录。

## ④ 运维

- 版本变化需复核权限、依赖与网络行为。
- `reportUrl` 失效时暂停展示或改挂有效复核入口。
- 页面不得把 dsh.so 表述成社区自有或官方隶属服务。

## ⑤ 收录徽章（供作者挂 README）

| 资源 | 含义 |
| --- | --- |
| [`assets/badges/listed.svg`](../assets/badges/listed.svg) | 已收录 |
| [`assets/badges/passed.svg`](../assets/badges/passed.svg) | 目录展示 ✅ |
| [`assets/badges/warning.svg`](../assets/badges/warning.svg) | 目录展示 ⚠️ |

安全结论以卡片披露与 `reportUrl` 为准；目录徽章只表示当前收录状态。
