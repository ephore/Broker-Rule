# Loon 分流规则

与 `Clash/` 目录一一对应，共 **784 条**规则（逐文件条数与 `Clash/*.yaml` 完全一致，由 `scripts/sync_loon.py --check` 校验）。

| 文件 | 条数 | [Rule] 里指定的策略 | 对应 Clash 文件 |
|---|---|---|---|
| `adblock.list` | 52 | `REJECT` | Clash/adblock.yaml |
| `direct.list` | 53 | `DIRECT` | Clash/direct.yaml |
| `jp.list` | 98 | `🇯🇵 日本专线` | Clash/jp.yaml（含 Cloudflare 15 个 IPv4 + 7 个 IPv6 段） |
| `hk.list` | 45 | `🇭🇰 香港专线` | Clash/hk.yaml |
| `tw.list` | 102 | `🇨🇳 台湾专线` | Clash/tw.yaml |
| `us.list` | 318 | `🇺🇸 美国专线` | Clash/us.yaml |
| `de.list` | 41 | `🇩🇪 德国专线` | Clash/de.yaml |
| `sea.list` | 75 | `🌏 东南亚专线` | Clash/sea.yaml（Polymarket / Hyperliquid / PolyEase / predict.fun / trade.xyz） |

`Clash/kr.yaml` 为空规则集（0 条），不生成对应的 Loon 文件。

## 使用方法

把下面这段加到 Loon 配置的 `[Rule]` 段（**顺序不能乱**，自上而下匹配、命中即停）：

```
[Rule]
# 去广告（最先匹配）
RULE-SET,https://raw.githubusercontent.com/ephore/Broker-Rule/main/Loon/adblock.list,REJECT

# 学术出版直连
RULE-SET,https://raw.githubusercontent.com/ephore/Broker-Rule/main/Loon/direct.list,DIRECT

# 分区专线（策略名需与 Loon 配置一致）
RULE-SET,https://raw.githubusercontent.com/ephore/Broker-Rule/main/Loon/jp.list,🇯🇵 日本专线
RULE-SET,https://raw.githubusercontent.com/ephore/Broker-Rule/main/Loon/hk.list,🇭🇰 香港专线
RULE-SET,https://raw.githubusercontent.com/ephore/Broker-Rule/main/Loon/tw.list,🇨🇳 台湾专线
RULE-SET,https://raw.githubusercontent.com/ephore/Broker-Rule/main/Loon/us.list,🇺🇸 美国专线
RULE-SET,https://raw.githubusercontent.com/ephore/Broker-Rule/main/Loon/de.list,🇩🇪 德国专线
RULE-SET,https://raw.githubusercontent.com/ephore/Broker-Rule/main/Loon/sea.list,🌏 东南亚专线

# 兜底（FINAL 只能写在配置里）
FINAL,PROXY
```

## 策略名写在 [Rule] 里，不在 .list 里

`.list` 文件**只包含规则本身**（`DOMAIN-SUFFIX,x` / `IP-CIDR,x`），不带策略名。
策略在 `[Rule]` 段的 `RULE-SET,<url>,<策略>` 指定。

## 必做：在 Loon 里建同名策略

`.list` 里的目标策略名必须和 Loon 配置里的一致，否则规则不生效。需要建：

`🇯🇵 日本专线`、`🇭🇰 香港专线`、`🇨🇳 台湾专线`、`🇺🇸 美国专线`、`🇩🇪 德国专线`、`🌏 东南亚专线`

或者把 `.list` 里的策略名全局替换成你已有的策略名。

## 与 Clash 版的差异

1. **无 `payload:` 包装** —— Loon 的 `.list` 每行就是一条规则
2. **顺序即优先级** —— Clash 版靠脚本 `prepend` 插到最前；Loon 版靠 `[Rule]` 段里的书写顺序，**RULE-SET 必须写在原有规则之前**
3. **`FINAL` 不能写进 .list** —— 只能写在配置的 `[Rule]` 段末尾
4. **Loon 没有覆写脚本机制** —— 改规则只能改 `.list` 或 `[Rule]` 段，没有 FlClash 那种 `main(config)` 注入
5. **`Clash/sea.yaml` 与 `jp.list` 的 Cloudflare 段并存时** —— `sea.list` 排在 `jp.list` 之前的写法只影响两者重叠的域名（目前无重叠），Cloudflare IP 段仍归 `jp.list`

## 转换对照

| Clash 写法 | Loon 写法 |
|---|---|
| `+.example.com`（domain 格式） | `DOMAIN-SUFFIX,example.com` |
| `example.com`（domain 格式） | `DOMAIN,example.com` |
| `DOMAIN-SUFFIX,example.com` | `DOMAIN-SUFFIX,example.com` |
| `DOMAIN,secure.fundsupermart.com` | `DOMAIN,secure.fundsupermart.com` |
| `IP-CIDR,1.2.3.0/24` | `IP-CIDR,1.2.3.0/24` |

策略名不写进 `.list`，由上面 `[Rule]` 段的 `RULE-SET,<url>,<策略>` 指定。

## 注意事项

- `.list` 里**没有注释**（Loon 对规则文件注释的支持依版本而定，为保证解析稳定，注释统一放本 README）
- `jp.list` 含 Cloudflare 的 15 个 IPv4 + 7 个 IPv6 段 → 所有 Cloudflare 站点走日本节点，注意节点负载
- 规则集是**远程引用**，统一走 `raw.githubusercontent.com`（无 CDN 缓存，推送即生效）；直连不通时用代理访问，或临时换 `gcore.jsdelivr.net` 镜像（CDN 有 12–24h 缓存滞后，改规则后别指望立刻生效）

## 同步机制

`Loon/` 是 `Clash/` 的派生产物，**不要单独手改 `.list`**。改完 `Clash/*.yaml` 后执行：

```
python scripts/sync_loon.py          # 从 Clash/*.yaml 重新生成 Loon/*.list
python scripts/sync_loon.py --check  # CI 用：任一文件不同步则退出码 1
```

转换规则：`'+.x.com'`→`DOMAIN-SUFFIX,x.com`，`'x.com'`→`DOMAIN,x.com`，已含类型前缀的行（`IP-CIDR,` 等）原样保留。
