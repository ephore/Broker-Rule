# Loon 分流规则

与 `Clash/` 目录一一对应，共 **650 条**规则。

| 文件 | 条数 | [Rule] 里指定的策略 | 对应 Clash 文件 |
|---|---|---|---|
| `adblock.list` | 52 | `REJECT` | Clash/adblock.yaml |
| `direct.list` | 48 | `DIRECT` | Clash/direct.yaml |
| `jp.list` | 91 | `🇯🇵 日本专线` | Clash/jp.yaml（含 Cloudflare） |
| `hk.list` | 24 | `🇭🇰 香港专线` | Clash/hk.yaml |
| `tw.list` | 86 | `🇨🇳 台湾专线` | Clash/tw.yaml |
| `us.list` | 321 | `🇺🇸 美国专线` | Clash/us.yaml |
| `de.list` | 28 | `🇩🇪 德国专线` | Clash/de.yaml |

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

# 兜底（FINAL 只能写在配置里）
FINAL,PROXY
```

## 策略名写在 [Rule] 里，不在 .list 里

`.list` 文件**只包含规则本身**（`DOMAIN-SUFFIX,x` / `IP-CIDR,x`），不带策略名。
策略在 `[Rule]` 段的 `RULE-SET,<url>,<策略>` 指定。

## 必做：在 Loon 里建同名策略

`.list` 里的目标策略名必须和 Loon 配置里的一致，否则规则不生效。需要建：

`🇯🇵 日本专线`、`🇭🇰 香港专线`、`🇨🇳 台湾专线`、`🇺🇸 美国专线`、`🇩🇪 德国专线`

或者把 `.list` 里的策略名全局替换成你已有的策略名。

## 与 Clash 版的差异

1. **无 `payload:` 包装** —— Loon 的 `.list` 每行就是一条规则
2. **顺序即优先级** —— Clash 版靠脚本 `prepend` 插到最前；Loon 版靠 `[Rule]` 段里的书写顺序，**RULE-SET 必须写在原有规则之前**
5. **`FINAL` 不能写进 .list** —— 只能写在配置的 `[Rule]` 段末尾
5. **Loon 没有覆写脚本机制** —— 改规则只能改 `.list` 或 `[Rule]` 段，没有 FlClash 那种 `main(config)` 注入

## 转换对照

| Clash 写法 | Loon 写法 |
|---|---|
| `+.example.com`（domain 格式） | `DOMAIN-SUFFIX,example.com,POLICY` |
| `example.com`（domain 格式） | `DOMAIN,example.com,POLICY` |
| `DOMAIN-SUFFIX,example.com` | `DOMAIN-SUFFIX,example.com,POLICY` |
| `DOMAIN-KEYWORD,stripe` | `DOMAIN-KEYWORD,stripe,POLICY` |
| `IP-CIDR,1.2.3.0/24,no-resolve` | `IP-CIDR,1.2.3.0/24,POLICY,no-resolve` |
| `REJECT` / `DIRECT` | 相同 |

## 注意事项

- `.list` 里**没有注释**（Loon 对规则文件注释的支持依版本而定，为保证解析稳定，注释统一放本 README）
- `jp.list` 含 Cloudflare 的 15 个 IP 段 → 所有 Cloudflare 站点走日本节点，注意节点负载
- 规则集是**远程引用**，首次加载需能访问 `raw.githubusercontent.com`；被墙可换 `fastly.jsdelivr.net` 镜像
