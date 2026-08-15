# model-sync 更新报告（最终版）

> **版本**：0.1.5（2026-08-15）
> **范围**：额度体系全面升级（余额/窗口/累计用量）+ 设置页重构 + 基准持久化加固 + 圆环布局视觉调整 + 重置倒计时 + 设置页语境化 Icon
> **基座**：`@deepseek-ai/dsh` 0.1.0-rc.6（未升级）　**依赖**：零新增（Node 内置 + DSH 自带）

---

## 〇、0.1.5 增量（重置倒计时 + 设置页 Icon）

1. **重置倒计时**：圆环 hover 详情（popup）重构为**每窗口一行**（7D/5H 各自独立行），显示「剩余 X% · 重置倒计时」；用量详情页窗口行把绝对时间改为倒计时（`countdownText`：`X 天 X 小时后重置` / `X 小时 X 分后重置` / `X 分钟后重置` / `即将重置`，中英双语键）。
2. **设置页 nav Icon**：settings-general 仅给内置 section id（models/agent-presets/plugins）配图标，第三方 section 一律回退齿轮——插件用 `MutationObserver` 按 nav label 文本匹配，重写 gear SVG 为 16px outline 图标（复制自 `dsh-client-ui-primitives`）：**模型同步 → `IconRefreshOutline16`**（循环同步箭头）、**用量详情 → `IconListPenOutline16`**（明细清单），风格与内置 icon 一致；保留原 navIcon wrapper 类。

---

## 一、需求总览

| # | 需求 | 状态 |
|---|---|---|
| 1 | 对话框用量增加 API 调用模型用量显示，剩余百分比 = 当前余额 ÷ 最后一次充值后的余额 | ✅ |
| 2 | 拓展全部可拓展供应商（按量余额 / 套餐窗口） | ✅ |
| 3 | 套餐窗口与加量包并存的竞态规则：图标只显窗口，余额只在详情展开 | ✅ |
| 4 | 单额度画单环、双额度画双环；滑条颜色按剩余比例语义化 | ✅ |
| 5 | 设置页新建「用量详情」分页；重构「模型同步」页布局 | ✅ |
| 6 | 余额基准本地持久化（修复"每次重启重置"观感） | ✅ |
| 7 | 圆环位置移动（模型名称右侧、上下文进度条左侧）+ 尺寸与配色调整 | ✅ |

---

## 二、功能变更

### 2.1 API 按量模型用量显示

- 对话框额度圆环新增按量模型（`deepseek-official`）余额显示。
- **公式**：剩余百分比 = `当前余额 / 最后一次充值后的余额`（充值后归 100%，用掉 10 元 → 90%）。
- **充值检测**：平台无充值历史 API，插件自维护基准——轮询发现余额高于持久化基准即视为充值，基准重置为新余额（首次采集以当前余额为基准）。
- **基准持久化**：`.dsh/profiles/<profile>/model-sync.baseline.json`（原子写 tmp+rename，写队列串行防并发竞态）。

### 2.2 全供应商覆盖（逐家真实凭据实测）

| Provider | 按量余额 | 套餐窗口 | 落地 |
|---|---|---|---|
| deepseek-official | ✅ `GET /user/balance` | — | 余额（充值基准本地追踪 + `baselineAt`） |
| kimi-coding | ✅ `boosterWallet.balance`（平台自带 amount/amountLeft 基准） | ✅ 5h/7d | 加量包余额 + 窗口 + 累计用量 |
| xai (grok) | ❌ 无公开 REST | ✅ gRPC-web `GetGrokCreditsConfig` | 7 天窗口（替换"尚未接入"） |
| zai / minimax-cn | ❌ 无公开端点（探测 404） | ✅ 5h/7d | 窗口 + zai 累计用量 |
| xiaomi | ❌ 无公开端点 | ❌ | 无数据 |
| openai-codex | — | ✅ wham/usage | 窗口 |

- **Grok gRPC-web 移植**：从 CC Switch（`farion1231/cc-switch` `subscription_grok.rs`）移植——空帧 POST + 通用 protobuf 扫描启发式（路径末段=1 的 [0,100] float 为用量百分比、`[1,5,1]` varint 为重置时间）。实测 used 52%。
- **Kimi 加量包**：`amount`（总充值 25 亿点）/ `amountLeft`（剩余 15.85 亿点）→ 剩余 63.4%；平台自带基准，无需本地追踪。
- **累计用量**：`QuotaWindow.usedRaw/limitRaw/rawUnit` 承载原始计数（kimi 56/100 次、zai 5150/10000 次）。

### 2.3 渲染规则（图标 / 详情 / 颜色 / 尺寸）

1. **竞态规则**：有套餐窗口的 provider 图标只显窗口（如 kimi 加量包只在 hover 详情展开）；纯余额 provider（deepseek）余额上图标。
2. **单/双环**：单额度（仅 1 窗口或仅余额）画单环；5h+7d 双额度才画双环。
3. **滑条颜色**（HSL 插值，色相主导、明度协调；**双主题色板**，检测 `body[data-ds-dark-theme]`）：

   | 剩余 | 暗色主题 | 亮色主题（深色锚点保 ≥3:1 对比） |
   |---|---|---|
   | 0% | `hsl(0, 65%, 42%)` 暗红 | `hsl(0, 70%, 38%)` 深红（3.79:1） |
   | 50% | `hsl(80, 62%, 47%)` 黄绿 | —（插值） |
   | 75% | `hsl(120, 60%, 50%)` 绿色 | `hsl(145, 72%, 22%)` 深墨绿（3.02:1，原 1.4:1） |
   | 100% | `hsl(205, 50%, 65%)` 天蓝 | `hsl(215, 70%, 35%)` 深蓝（3.12:1） |

4. **位置**：输入栏 **模型名称（model seat）右侧、上下文进度条（ContextMeter）左侧**——CSS `order` 重排。坑：SlotOutlet 锚点是 `display:contents` div（非 flex item），order 必须作用于锚点**内部**元素（`[data-slot="conversation.input.model"] > ._7KE1Ra_root` order 1 / `[data-slot="conversation.input.right"] > .msync-wrap` order 2 / `.JObwrW_root` order 3；trailing 容器哈希类 `uV2eYG_trailing`，rc.6 产物，DSH 升级需复核）。
5. **尺寸**：单环 **14.4px**（基准 12px，略小于 ContextMeter 14px，整体 ×1.2），双环 **21.6px**（= 单环 × 1.5）。
6. **popup 详情**：窗口行（含累计用量/剩余%/重置时间，标签随窗口数动态）、加量包/余额行（`剩余 X% · 当前 / 基准`）、title 悬停提示。

### 2.4 设置页（原生分页）

`settings.section` 是 list slot，多注册一条目即左侧导航新分页（源码核实 `dsh-client-ui-settings-general`）：

- **「模型同步」**（order 16）：供应商模型管理（名称 + baseURL + 应用新模型 + chips 横向滚动 + 错误行）+ 折叠「插件启停」（details 默认收起）。额度杂项全部移出。
- **「用量详情」**（order 17，新）：每供应商额度表格——窗口（累计用量/剩余%/重置时间 + `quotaColor` 进度条）、加量包、API 余额（含「基准记录于 …」时间戳）；顶部更新时间 + 刷新，60s 自动轮询；余额 provider 提供「以当前余额为基准」手动校正按钮。

### 2.5 基准持久化加固（0.1.2 修复）

- **诊断结论**：持久化机制本身工作正常（基准文件已落盘，运行中 `current: 39.56, lastRecharge: 39.59` 跨进程保持；dsh 启动不清理 profile 目录）。"每次重启重置"观感来自**首采锚点**——功能首次启用时无历史基准，只能以当时余额为基准，此后显示 ≈100%；且 `persistBaseline` 的 `.catch(() => {})` 静默吞掉一切写入错误。
- **修复**：① 持久化失败记 `model-sync baseline persist failed` 日志（读写均记录）；② `QuotaBalance.baselineAt` 透出基准设定时间；③ 新增 `POST /baseline-reset` + 详情页「以当前余额为基准」按钮（覆盖启用前已充值的首采失真场景）。

---

## 三、文件变更清单

| 文件 | 变更 |
|---|---|
| `src/domain.ts` | `QuotaWindow.usedRaw/limitRaw/rawUnit`；`QuotaBalance.label/baselineAt` |
| `src/quota.ts` | DeepSeek 余额 + 充值基准（日志化持久化、`collectBalance`/`resetBaseline`）；Kimi 加量包 + 累计用量；Grok gRPC-web 移植（~150 行）；zai 累计用量 |
| `src/http.ts` | 补充 `deepseek-official` provider；`deepseekApiKeyEnv` 提取；`/baseline-reset` 路由 |
| `client/client.js` | `quotaColor`（HSL 锚点插值）；单/双环三态渲染 + 尺寸（14.4/21.6）；`findBalance` 竞态规则；`UsagePage` + section 分页注册；`SettingsPage` 布局重构；`compactNum`/动态 label；trailing 区 CSS order 重排 |
| `AGENTS.md` | 已完成插件表：model-sync 能力与渲染约定（含哈希类复核提示、基准文件语义） |
| `CHANGELOG.md` | 本报告 |

---

## 四、关键设计决策

1. **充值基准本地持久化**（DeepSeek）：平台无充值历史 API → 本地 JSON 快照，余额跳升 = 充值重置；原子写 + 串行队列防竞态；失败日志化不静默。
2. **平台基准优先**（Kimi）：`BalanceReading.lastRecharge?` 可选——平台给总量（加量包 amount）直接复用，跳过本地追踪。
3. **Grok 账单走 gRPC-web 移植**：无公开 REST 端点；移植 CC Switch 已验证的 protobuf 启发式，不自研逆向。
4. **分页用原生 list slot**：`settings.section` 多注册一条目即左侧导航新分页，无需 fallback。
5. **职责分离**：模型管理（模型同步页）与额度信息（用量详情页）彻底分开；图标/详情两级信息密度（图标只表达主额度，详情承载全部）。
6. **纯 CSS 布局重排**：额度环位置移动零运行时开销；`data-slot` 契约属性做锚点，哈希类仅 trailing 容器一处（rc.6 锁定下稳定）。

---

## 五、实测结果（真实凭据）

```
deepseek-official → balance { current: 39.55, lastRecharge: 39.59, unit: 'CNY', baselineAt }（基准跨进程保持）
kimi-coding       → 5h 累计 0/100 次 · 7d 累计 56/100 次 · 加量包 15.85亿/25亿 点（剩余 63.4%）
zai               → 7d 累计 5150/10000 次（percentage=51 吻合）· 5h 0/2000 次
xai (grok)        → 7d 窗口 used 52% / 剩余 48%，重置 7 天后
```

---

## 六、验证状态

- ✅ `pnpm build`（tsc strict）+ `node --check` 通过
- ✅ Host 采集器 mock-ctx 实测（余额保持、raw 透出、resetBaseline `{ok:true}`、写失败日志捕获）
- ✅ client 渲染逻辑模拟（颜色锚点、单/双环模式与尺寸、累计用量文本、trailing order 重排对照真实 DOM）
- ⏳ 运行态 UI 验收：重启 `dsh web` 后核对输入栏布局、两页内容与接口

## 七、验收步骤（重启后）

1. 重启 `dsh web`
2. `Invoke-RestMethod http://127.0.0.1:3080/agentteam/model-sync/state`：
   - `deepseek-official` → quota.balance（含 baselineAt）
   - `kimi-coding` → windows 带 usedRaw/limitRaw + balance（加量包）
   - `xai` → windows 含 7d（used≈52）
3. 浏览器：输入栏顺序 `[模型名称] [额度环] [上下文进度条] [发送]`；单环 14.4px / 双环 21.6px；设置页「模型同步」精简布局 +「用量详情」表格正确

## 八、已知限制

- xiaomi / minimax 无公开余额端点；zai / xai 余额不可得（仅窗口）——`collectQuota` 已留分支，平台开放后即插即用。
- Grok 账单为逆向协议，平台改版可能失效（失败仅显示 reason，不影响其它 provider）。
- kimi/zai 的 `rawUnit` 暂按「次」展示；若平台口径为 token/点数，后续调整文案。
- 圆环位置依赖 trailing 容器哈希类 `uV2eYG_trailing`（rc.6 产物）——DSH 升级需复核；类名变化只会让环回到原位，不影响功能。
- 基准文件首采=启用时余额；启用前已充值可用详情页「以当前余额为基准」校正或手改 `model-sync.baseline.json` 的 `lastRecharge`。
