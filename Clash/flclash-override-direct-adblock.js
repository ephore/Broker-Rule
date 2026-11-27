// ══════════════════════════════════════════════════════════════
//  FlClash 覆写脚本 · 精简版（仅 去广告 + 学术直连）
//
//  规则集
//    ├─ direct.yaml   → RULE-SET,my-direct,DIRECT    学术白名单（classical）
//    ├─ adblock.yaml  → RULE-SET,my-adblock,REJECT   自定义广告（classical）
//    └─ blackmatrix7  → RULE-SET,bm7-ad,REJECT       第三方去广告（classical）
//
//  与完整版 flclash-override-mesl.js 的区别：
//    不含任何地区专线策略组（日本/香港/台湾/美国/德国/东南亚），
//    不注入 RULE-SET,my-xx,地区专线的分流规则，只做「拦截 + 白名单直连」。
//    其余规则全部原样保留，交给订阅自带的策略处理。
//
//  ⚠️ 脚本会同时开启 sniffer（域名嗅探）——否则 QUIC/直连 IP 的广告拦不住
//
//  ⚠️ behavior 必须和文件格式匹配：本脚本全部 provider 均为 "classical"
//       （Clash/*.yaml 每行都带 DOMAIN / DOMAIN-SUFFIX 类型前缀）
//
//  安装（URL 导入，推荐）：
//       底部「配置」→ 右上「覆写脚本」→ ＋ → 加载方式选 URL → 粘贴
//       https://raw.githubusercontent.com/ephore/Broker-Rule/main/Clash/flclash-override-direct-adblock.js
//       → 保存
//       配置页 → 订阅卡片 ⋮ → 更多 → 覆写 → 选中本脚本 → 确定
//       首页 → 重启连接
//       ⚠️ 必须用 Raw 链接；blob 页链接会报 SyntaxError: unexpected token '<'
//       ⚠️ 只创建不关联到订阅不会生效
//
//  更新：
//       FlClash ≥ 0.9.4 会记住导入 URL 并自动更新，也可手动触发刷新
//       < 0.9.4 为一次性下载，改完需重新「URL 导入」或重新粘贴
//       ⚠️ 规则集 provider 走 cdn.jsdelivr.net，其 @main 快照缓存有滞后：
//         推送后若拿到旧版，去 purge.jsdelivr.net 清对应文件，或等几分钟
//         例：https://purge.jsdelivr.net/gh/ephore/Broker-Rule@main/Clash/adblock.yaml
// ══════════════════════════════════════════════════════════════

function main(config) {
  if (!config || typeof config !== "object") return config;

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
      type: "http", behavior: "classical", format: "yaml",
      url: "https://cdn.jsdelivr.net/gh/ephore/Broker-Rule@main/Clash/direct.yaml",
      path: "./ruleset/my-direct.yaml", interval: 3600
    },

    "my-adblock": {
      type: "http", behavior: "classical", format: "yaml",
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
    }
  };

  config["rule-providers"] = Object.assign({}, config["rule-providers"], PROVIDERS);

  // ── 2. 规则顺序（自上而下，命中即停）────────────────────────
  var prepend = [
    "RULE-SET,my-direct,DIRECT",      // ① 学术白名单
    "RULE-SET,my-adblock,REJECT",     // ② 自定义广告
    "RULE-SET,bm7-ad,REJECT"          // ③ blackmatrix7
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
