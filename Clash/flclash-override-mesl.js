// ══════════════════════════════════════════════════════════════
//  FlClash 覆写脚本 · 完整版（日本 + 香港 + 台湾 + 美国 + 德国 + 韩国 六条专线）
//
//  规则集（ephore/Broker-Rule → Clash/）
//    ├─ adblock.yaml  → RULE-SET,my-adblock,REJECT   广告（domain）
//    ├─ direct.yaml   → RULE-SET,my-direct,DIRECT    学术直连（domain）
//    ├─ jp.yaml       → RULE-SET,my-jp,🇯🇵 日本专线   券商/开发 + Cloudflare（classical）
//    ├─ hk.yaml       → RULE-SET,my-hk,🇭🇰 香港专线   Stripe/iFAST/Wise（classical）
//    ├─ tw.yaml       → RULE-SET,my-tw,🇨🇳 台湾专线   交易所/钱包/CDN（domain）
//    ├─ us.yaml       → RULE-SET,my-us,🇺🇸 美国专线   AT&T/DIRECTV/Yahoo/Reddit（domain）
//    ├─ de.yaml       → RULE-SET,my-de,🇩🇪 德国专线   N26/Kraken/Coinbase（classical）
//    └─ kr.yaml       → RULE-SET,my-kr,🇰🇷 韩国专线   Polymarket（classical）
//  外部
//    └─ blackmatrix7 → RULE-SET,bm7-ad,REJECT
//
//  ⚠️ 脚本会同时开启 sniffer（域名嗅探）——否则 QUIC/直连 IP 的广告拦不住
//
//  ⚠️ behavior 必须和文件格式匹配：
//       adblock / direct / tw / us = "domain"
//       hk / bm7-ad / de / jp / kr = "classical"
//
//  安装：工具 → 进阶配置 → 脚本 → 添加 → 粘贴 → 保存
//       配置 → 选中订阅 → ⋮ → 更多 → 覆写 → 模式「脚本」→ 选中
//       仪表盘 → 重启连接
// ══════════════════════════════════════════════════════════════

function main(config) {
  if (!config || typeof config !== "object") return config;

  // ── 0. 自定义策略组 ─────────────────────────────────────────
  //    家宽排前面：住宅 IP 对券商/支付的风控更友好
  //    日本专线已包含 MESL 全部 12 个日本节点
  var GROUPS = [
    {
      name: "🇯🇵 日本专线",
      type: "select",
      proxies: [
      "🇯🇵 日本 08 家宽",
      "🇯🇵 日本 09 家宽",
      "🇯🇵 日本 10 家宽",
      "🇯🇵 日本 11 家宽",
      "🇯🇵 日本 12 家宽",
      "🇯🇵 日本 01 [0.3X]",
      "🇯🇵 日本 02",
      "🇯🇵 日本 03",
      "🇯🇵 日本 04",
      "🇯🇵 日本 05",
      "🇯🇵 日本 06",
      "🇯🇵 日本 07",
      "DIRECT"
      ]
    },
    {
      name: "🇭🇰 香港专线",
      type: "select",
      proxies: [
      "🇭🇰 香港 13 家宽",
      "🇭🇰 香港 14 家宽",
      "🇭🇰 香港 15 家宽",
      "🇭🇰 香港 01",
      "🇭🇰 香港 02",
      "🇭🇰 香港 03 [0.3X]",
      "🇭🇰 香港 04",
      "🇭🇰 香港 05",
      "🇭🇰 香港 06",
      "🇭🇰 香港 07",
      "🇭🇰 香港 08",
      "🇭🇰 香港 09",
      "🇭🇰 香港 10",
      "🇭🇰 香港 11",
      "🇭🇰 香港 12",
      "DIRECT"
      ]
    },
    {
      name: "🇨🇳 台湾专线",
      type: "select",
      proxies: [
      "🇨🇳 台湾 05 家宽",
      "🇨🇳 台湾 06 家宽",
      "🇨🇳 台湾 07 家宽",
      "🇨🇳 台湾 08 家宽",
      "🇨🇳 台湾 09 家宽",
      "🇨🇳 台湾 01 [0.3X]",
      "🇨🇳 台湾 02",
      "🇨🇳 台湾 03",
      "🇨🇳 台湾 04",
      "DIRECT"
      ]
    },
    {
      name: "🇺🇸 美国专线",
      type: "select",
      proxies: [
      "🇺🇸 美国 10 家宽",
      "🇺🇸 美国 11 家宽",
      "🇺🇸 美国 12 家宽",
      "🇺🇸 美国 13 家宽",
      "🇺🇸 美国 14 家宽",
      "🇺🇸 美国 01",
      "🇺🇸 美国 02",
      "🇺🇸 美国 03",
      "🇺🇸 美国 04",
      "🇺🇸 美国 05",
      "🇺🇸 美国 06",
      "🇺🇸 美国 07",
      "🇺🇸 美国 08",
      "🇺🇸 美国 09",
      "DIRECT"
      ]
    },
    {
      name: "🇩🇪 德国专线",
      type: "select",
      proxies: [
      "🇩🇪 德国 04 家宽",
      "🇩🇪 德国 01",
      "🇩🇪 德国 02",
      "🇩🇪 德国 03",
      "DIRECT"
      ]
    },
    {
      // Polymarket 专用：家宽优先（预测市场对住宅 IP 风控更友好）
      name: "🇰🇷 韩国专线",
      type: "select",
      proxies: [
      "🇰🇷 韩国 03 家宽",
      "🇰🇷 韩国 04 家宽",
      "🇰🇷 韩国 05 家宽",
      "🇰🇷 韩国 01",
      "🇰🇷 韩国 02",
      "DIRECT"
      ]
    }
  ];

  if (!Array.isArray(config["proxy-groups"])) config["proxy-groups"] = [];
  GROUPS.forEach(function (g) {
    var i = config["proxy-groups"].findIndex(function (x) {
      return x && x.name === g.name;
    });
    if (i >= 0) config["proxy-groups"][i] = g;
    else config["proxy-groups"].unshift(g);
  });

  // ── 0.5 开启域名嗅探 ───────────────────────────────────────
  //    作用：让「直连 IP」和「QUIC/HTTP3」的连接也能识别出域名，
  //          否则广告 SDK（自带 DNS / 硬编码 IP / 走 UDP 443）会绕过所有
  //          DOMAIN-SUFFIX 规则 —— 这是开屏广告拦不住的根因。
  config["sniffer"] = {
    enable: true,
    "force-dns-mapping": true,
    "parse-pure-ip": true,
    "override-destination": false,
    sniff: {
      HTTP: { ports: [80, "8080-8880"], "override-destination": true },
      TLS:  { ports: [443, 8443] },
      QUIC: { ports: [443, 8443] }
    }
  };

  // ── 1. 规则集定义 ───────────────────────────────────────────
  var PROVIDERS = {

    "my-direct": {
      type: "http", behavior: "domain", format: "yaml",
      url: "https://cdn.jsdelivr.net/gh/ephore/Broker-Rule@main/Clash/direct.yaml",
      path: "./ruleset/my-direct.yaml", interval: 3600
    },

    "my-adblock": {
      type: "http", behavior: "domain", format: "yaml",
      url: "https://cdn.jsdelivr.net/gh/ephore/Broker-Rule@main/Clash/adblock.yaml",
      path: "./ruleset/my-adblock.yaml", interval: 3600
    },

    // blackmatrix7 去广告 · 全量版（131,987 条）
    //   精简版 Advertising.yaml            545 条 / 15 KB    ← 以前用的
    //   全量版 Advertising_Classical.yaml  131,987 条 / 4.4 MB ← 现在用的
    //   全量版含 115,185 条 DOMAIN-SUFFIX + 16,257 条 DOMAIN + 428 条 IP-CIDR
    //   想省内存可用 Advertising_Domain.yaml（13.1 万条，无 IP 规则，3.2 MB）
    "bm7-ad": {
      type: "http", behavior: "classical", format: "yaml",
      url: "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@release/rule/Clash/Advertising/Advertising_Classical.yaml",
      path: "./ruleset/bm7-ad.yaml", interval: 3600
    },

    // 日本：classical 格式（jp.yaml 已并入 Cloudflare 的 15 个 IP 段）
    "my-jp": {
      type: "http", behavior: "classical", format: "yaml",
      // 注：cdn.jsdelivr.net 该文件缓存未刷新，暂用 fastly 镜像
      url: "https://fastly.jsdelivr.net/gh/ephore/Broker-Rule@main/Clash/jp.yaml",
      path: "./ruleset/my-jp.yaml", interval: 3600
    },

    // 香港：classical 格式（含 DOMAIN-KEYWORD,stripe）
    "my-hk": {
      type: "http", behavior: "classical", format: "yaml",
      url: "https://cdn.jsdelivr.net/gh/ephore/Broker-Rule@main/Clash/hk.yaml",
      path: "./ruleset/my-hk.yaml", interval: 3600
    },

    // 台湾：domain 格式
    "my-tw": {
      type: "http", behavior: "domain", format: "yaml",
      url: "https://cdn.jsdelivr.net/gh/ephore/Broker-Rule@main/Clash/tw.yaml",
      path: "./ruleset/my-tw.yaml", interval: 3600
    },

    // 美国：domain 格式
    "my-us": {
      type: "http", behavior: "domain", format: "yaml",
      url: "https://cdn.jsdelivr.net/gh/ephore/Broker-Rule@main/Clash/us.yaml",
      path: "./ruleset/my-us.yaml", interval: 3600
    },

    // 德国：classical 格式（含 DOMAIN-KEYWORD,s2xiwm.）
    "my-de": {
      type: "http", behavior: "classical", format: "yaml",
      url: "https://cdn.jsdelivr.net/gh/ephore/Broker-Rule@main/Clash/de.yaml",
      path: "./ruleset/my-de.yaml", interval: 3600
    },

    // 韩国：classical 格式（Polymarket 专用域名）
    //   jsDelivr 刚推的 @main 文件有缓存延迟，故走 fastly 镜像（同 my-jp）
    "my-kr": {
      type: "http", behavior: "classical", format: "yaml",
      url: "https://fastly.jsdelivr.net/gh/ephore/Broker-Rule@main/Clash/kr.yaml",
      path: "./ruleset/my-kr.yaml", interval: 3600
    }
  };

  config["rule-providers"] = Object.assign({}, config["rule-providers"], PROVIDERS);

  // ── 2. 规则顺序（自上而下，命中即停）────────────────────────
  var prepend = [
    "RULE-SET,my-direct,DIRECT",      // ① 学术白名单
    "RULE-SET,my-adblock,REJECT",     // ② 自定义广告
    "RULE-SET,bm7-ad,REJECT",         // ③ blackmatrix7
    "RULE-SET,my-hk,🇭🇰 香港专线",     // ④ 香港：Stripe / iFAST / Wise
    "RULE-SET,my-tw,🇨🇳 台湾专线",     // ⑤ 台湾：交易所 / 钱包 / CDN
    "RULE-SET,my-kr,🇰🇷 韩国专线",     // ⑥ 韩国：Polymarket
    "RULE-SET,my-jp,🇯🇵 日本专线",     // ⑦ 日本：券商 / 开发工具
    "RULE-SET,my-us,🇺🇸 美国专线",      // ⑧ 美国：AT&T / DIRECTV / Yahoo / Reddit
    "RULE-SET,my-de,🇩🇪 德国专线"       // ⑨ 德国：N26 / Kraken / Coinbase
  ];

  var existing = Array.isArray(config.rules) ? config.rules : [];
  config.rules = prepend.concat(existing);

  return config;
}

// ══════════════════════════════════════════════════════════════
//  bm7-ad 可选清单
//    精简  Advertising.yaml                     545 条    15 KB
//    全量  Advertising_Classical.yaml      131,987 条   4.4 MB  ← 当前
//    全量  Advertising_Domain.yaml         131,442 条   3.2 MB  （无 IP 规则）
//    全量  Advertising_Classical_No_Resolve.yaml  同全量 + no-resolve（更快）
//
//  ⚠️ 首次加载要下 4.4 MB，若 jsDelivr 不通会导致整份配置加载失败。
//     出问题就把 url 换回 Advertising.yaml 即可回滚。
// ══════════════════════════════════════════════════════════════