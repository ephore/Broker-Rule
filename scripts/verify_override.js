// 在 mock config 上实跑覆写脚本的 main()，验证 provider / 规则顺序 / 策略名
const fs = require('fs');
const path = process.argv[2];
const LITE = process.argv.includes('--lite');
const src = fs.readFileSync(path, 'utf8');

// 脚本以 main(config) 为入口，挂在全局
const mod = { exports: {} };
const fn = new Function('module', 'exports', src + '\n;return typeof main === "function" ? main : null;');
const main = fn(mod, mod.exports);
if (!main) { console.error('main() 未找到'); process.exit(1); }

const base = {
  proxies: [{ name: 'DIRECT' }],
  'proxy-groups': [],
  'rule-providers': {},
  rules: ['MATCH,DIRECT']
};
const out = main(JSON.parse(JSON.stringify(base)));

console.log('=== rule-providers ===');
const prov = out['rule-providers'];
for (const [k, v] of Object.entries(prov)) {
  console.log(`  ${k.padEnd(11)} behavior=${String(v.behavior).padEnd(10)} url=...${v.url.split('/Clash/').pop()}`);
}

// 期望：带类型前缀的文件必须 classical
const EXPECT_CLASSICAL = LITE ? ['direct', 'adblock'] : ['jp', 'hk', 'tw', 'de', 'sea'];
let bad = [];
for (const n of EXPECT_CLASSICAL) {
  const k = 'my-' + n;
  if (!prov[k]) { bad.push(`${k} 缺失`); continue; }
  if (prov[k].behavior !== 'classical') bad.push(`${k} behavior=${prov[k].behavior}，应为 classical`);
}
if (LITE) {
  if (!prov['bm7-ad']) bad.push('bm7-ad 缺失');
  else if (prov['bm7-ad'].behavior !== 'classical') bad.push('bm7-ad behavior 应为 classical');
  const regions = ['jp', 'hk', 'tw', 'us', 'de', 'sea'].map(n => 'my-' + n).filter(k => prov[k]);
  if (regions.length) bad.push(`精简版不应含地区 provider：${regions.join(', ')}`);
}
console.log('\n=== behavior 校验 ===');
console.log(bad.length ? 'FAIL: ' + bad.join('; ') : '全部 provider behavior 正确 ✓');

console.log('\n=== 规则顺序 ===');
const isMine = r => r.startsWith('RULE-SET,my-') || r.startsWith('RULE-SET,bm7-');
const myRules = out.rules.filter(isMine);
myRules.forEach((r, i) => console.log(`  ${i + 1}. ${r}`));
const matcher = out.rules.indexOf('MATCH,DIRECT');
const afterMatch = out.rules.filter((r, i) => i > matcher && isMine(r));
console.log(`MATCH 位于第 ${matcher + 1} 条；MATCH 之后的死规则: ${afterMatch.length} 条`);

if (LITE) {
  const expect = ['RULE-SET,my-direct,DIRECT', 'RULE-SET,my-adblock,REJECT', 'RULE-SET,bm7-ad,REJECT'];
  const okOrder = JSON.stringify(myRules) === JSON.stringify(expect);
  console.log(`\n期望顺序 ${okOrder ? '一致 ✓' : '不一致 ✗'}`);
  if (!okOrder) bad.push('规则顺序不符');
} else {
  // tw 在 sea 之前 → verify.walletconnect.org 只在 sea，无冲突
  const twIdx = myRules.findIndex(r => r.startsWith('RULE-SET,my-tw'));
  const seaIdx = myRules.findIndex(r => r.startsWith('RULE-SET,my-sea'));
  console.log(`\nmy-tw 第 ${twIdx + 1}，my-sea 第 ${seaIdx + 1}（tw 先命中）`);
}

console.log('\n结果:', bad.length || afterMatch.length ? `FAIL (${bad.length} 处 + ${afterMatch.length} 死规则)` : 'PASS');
process.exit(bad.length || afterMatch.length ? 1 : 0);
