# DeepSeek Honeys 插件目录

> 仓库：**awesome-dshoneys** · 面向 DeepSeek Honeys 微信群中文开发者社区（约 270 位群友共建维护）
>
> 一个「先检测、后收录」的认证插件目录：每一个收录条目都经过安全检测，**未检测不收录**。

[🌐 打开在线插件目录](https://dshoneys.github.io/awesome-dshoneys/) ·
[📮 提交或求插件](https://github.com/dshoneys/awesome-dshoneys/issues/new/choose) ·
[🛡️ 查看安全标准](docs/badge-spec.md)

---

## ① 项目定位：认证插件目录

群里每天有大量插件分享与求插件的需求，但插件质量参差不齐：有的好用省心，有的暗藏权限滥用、数据外传甚至密钥窃取行为。本仓库的目标是把群里零散的分享沉淀为一份**可信、可查、可追溯**的插件目录：

- **认证收录**：目录中的每一条目都附带安全徽章与对应的 [dsh.so](https://www.dsh.so/) 扫描结果。
- **未检测不收录**：dsh.so 是本目录指定的安全检测服务；没有可核验结果的插件不会进入目录。
- **群友实测驱动**：条目中的「群友实测备注」记录真实使用反馈，帮助后来的群友快速判断「这个插件在我这儿能不能用、坑在哪」。
- **需求墙**：想找但找不到的插件，可以直接提 Issue 求插件，热心群友认领开发（见「④ 如何提交」的 Issue 入口）。

一句话：**这里不是插件大杂烩，而是过了安全关的精选目录。**

---

## ② 如何查找插件

在线目录提供比 README 表格更直观的卡片展示和搜索能力：

- 搜索插件名称、作者、功能、标签和群友反馈
- 按效率工具、开发工具、数据接入和其他分类筛选
- 按安全等级筛选，并直接打开对应检测报告
- 搜索条件会写入网址，方便把结果分享给其他群友
- 桌面端按 `/` 可快速聚焦搜索框

目录数据统一保存在 [`data/plugins.json`](data/plugins.json)，字段约束见
[`data/plugins.schema.json`](data/plugins.schema.json)。网站会自动读取数据并生成插件卡片，避免同时维护网站与 README 两份目录。

---

## ③ 分类目录

已认证插件统一在[在线目录](https://dshoneys.github.io/awesome-dshoneys/)展示，按以下场景分类：

- **效率工具**：提升日常操作和内容处理效率
- **开发工具**：辅助编码、调试、构建和自动化
- **数据接入**：连接外部平台、服务和数据源
- **其他**：暂不适合以上分类的插件

当前正在等待首批认证插件。未通过检测的插件不会作为示例提前展示。

---

## ④ 如何提交

先在 [dsh.so 提交页](https://www.dsh.so/zh/submit/) 提交公开仓库并等待扫描，再通过 **Issue** 或 **PR** 申请社区收录。普通群友推荐使用 Issue。

### 入口一：Pull Request（推荐用于「交插件 / 修条目」）

1. 先取得 dsh.so 插件详情页与安全扫描结果。
2. 阅读 [CONTRIBUTING.md](CONTRIBUTING.md)，在 [`data/plugins.json`](data/plugins.json) 中添加条目。
3. 按 [PULL_REQUEST_TEMPLATE.md](PULL_REQUEST_TEMPLATE.md) 填写插件信息、dsh.so 链接和群友实测反馈。
4. 提交 PR，等待维护者核对扫描结果与目录数据后合并。

### 入口二：Issue（用于「求插件」或「不方便提 PR 的交插件」）

- **求插件**：使用 [.github/ISSUE_TEMPLATE/request-plugin.md](.github/ISSUE_TEMPLATE/request-plugin.md)，写清想解决什么问题、期望的功能；想认领开发的群友请在 Issue 下的认领区回帖。
- **交插件**：使用 [.github/ISSUE_TEMPLATE/submit-plugin.md](.github/ISSUE_TEMPLATE/submit-plugin.md)，填写插件信息、dsh.so 插件详情页与扫描结果链接；机器人会立即固定源码 commit、检查材料和安全证据，并更新评审状态。
- **整改复审**：作者修复后在 Issue 单独回复 `/recheck`，自动评审会更新原评论，不重复刷屏。

自动评审的检查范围、状态标签和安全边界见 [插件自动评审规则](docs/review-policy.md)。

---

## ⑤ 安全检测说明

安全检测是本目录的立身之本。[dsh.so](https://www.dsh.so/) 是本目录指定的独立安全检测服务；社区负责核验结果、执行收录规则和维护群友实测反馈，不把第三方服务表述为社区自有服务。

**dsh.so 重点检查**：

1. 第三方依赖与供应链风险
2. 插件权限和敏感数据行为
3. 密钥、凭据与敏感信息风险
4. 仓库真实性、安装信息与维护状态

**检测流程**：

1. 提交方先在 [dsh.so](https://www.dsh.so/zh/submit/) 提交公开仓库。
2. dsh.so 完成验证与安全扫描，生成可公开核验的插件详情页和结果。
3. 提交方通过 Issue 或 PR 申请社区收录，并附上上述链接。
4. Issue 自动评审检查固定 commit、外部扫描、危险能力和供应链证据；通过后进入同类比较。
5. 维护者依据 [徽章规范](docs/badge-spec.md) 完成最终评级；合并收录 PR 后自动发布到在线目录。

**两条铁律，最后重申**：

- **未检测不收录。** 没有 dsh.so 插件详情页和扫描结果，就不进入目录。
- **结果必须可核验。** 社区不自行改写 dsh.so 的扫描结果；结果变化时及时更新徽章或下架。

---

本仓库由 DeepSeek Honeys 微信群社区共建 · 遵循 [MIT License](LICENSE) · 有任何问题欢迎在群里 @维护者

dsh.so 是独立社区服务，并非 DeepSeek Honeys 所有；本目录将其指定为收录流程中的安全检测来源。社区补充复核记录仅作说明，不替代或篡改 dsh.so 的公开结论。
