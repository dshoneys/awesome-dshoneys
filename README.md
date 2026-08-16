# DeepSeek Honeys 插件目录

> 仓库：**awesome-dshoneys** · 面向 DeepSeek Honeys 微信群中文开发者社区（约 270 位群友共建维护）
>
> 按**热门需求**找方案：卡片标题是需求描述；**社区复核为主**，dsh.so 为可选参考。

[🌐 打开在线目录](https://dshoneys.github.io/awesome-dshoneys/) ·
[🎭 抽象区（整活）](https://dshoneys.github.io/awesome-dshoneys/meme.html) ·
[📮 提交或求插件](https://github.com/dshoneys/awesome-dshoneys/issues/new/choose) ·
[🛡️ 查看安全标准](docs/badge-spec.md)

---

## ① 项目定位

群里每天有大量插件分享与求插件的需求。本仓库把零散分享沉淀为**可查、可披露、按需求索引**的目录：

- **需求优先**：`demandTitle` 是首页主标题（用户要解决什么），包名放在副线。
- **社区复核为主**：维护者审源码与披露后决定上架 / ⚠️ / 暂缓。
- **dsh.so 可选参考**：有扫描页就挂上；没有也可先收录并写清风险。
- **群友实测**：真实使用反馈写在条目里。
- **需求墙**：找不到就提 Issue 求插件。

一句话：**先说清需求，再给带披露的可用方案。**

---

## ② 如何查找

- 搜索需求描述、插件名、作者、标签和反馈
- 按分类与安全等级筛选
- 卡片进入独立详情页（介绍 / 安装 / 复核入口）
- 搜索条件写入网址，方便分享；桌面端按 `/` 聚焦搜索

数据：[`data/plugins.json`](data/plugins.json) · 约束：[`data/plugins.schema.json`](data/plugins.schema.json)

---

## ③ 分类

- **效率工具** · **开发工具** · **数据接入** · **本地化** · **其他**

见[在线目录](https://dshoneys.github.io/awesome-dshoneys/)。

---

## ④ 如何提交

通过 **Issue** 或 **PR**。普通群友推荐 Issue。dsh.so 扫描建议有，但不是硬门槛。

### Pull Request

1. 阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。
2. 在 [`data/plugins.json`](data/plugins.json) 追加条目（含 `demandTitle`）。
3. 运行 `node scripts/validate-plugins.mjs`。
4. 按 PR 模板说明风险披露与复核依据。

### Issue

- **求插件**：[.github/ISSUE_TEMPLATE/request-plugin.md](.github/ISSUE_TEMPLATE/request-plugin.md)
- **交插件**：[.github/ISSUE_TEMPLATE/submit-plugin.md](.github/ISSUE_TEMPLATE/submit-plugin.md)
- **整改复审**：回复 `/recheck`

自动评审规则见 [docs/review-policy.md](docs/review-policy.md)。

---

## ⑤ 安全说明

- 公开徽章映射见 [docs/badge-spec.md](docs/badge-spec.md)。
- 未披露的关键高风险不收录；可披露的能力面可挂 ⚠️ 上架。
- [dsh.so](https://www.dsh.so/) 是独立服务，不是社区自有或官方担保。

---

本仓库由 DeepSeek Honeys 微信群社区共建 · 遵循 [MIT License](LICENSE)
