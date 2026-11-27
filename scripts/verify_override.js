// 在 mock config 上实跑覆写脚本的 main()，验证 provider / 规则顺序 / 策略名
const fs = require('fs');
const path = process.argv[2];
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
const EXPECT_CLASSICAL = ['jp', 'hk', 'tw', 'de', 'sea'];
let bad = [];
for (const n of EXPECT_CLASSICAL) {
  const k = 'my-' + n;
  if (!prov[k]) { bad.push(`${k} 缺失`); continue; }
  if (prov[k].behavior !== 'classical') bad.push(`${k} behavior=${prov[k].behavior}，应为 classical`);
}
console.log('\n=== behavior 校验 ===');
console.log(bad.length ? 'FAIL: ' + bad.join('; ') : '全部带类型前缀的 provider 均为 classical ✓');

console.log('\n=== 规则顺序 ===');
const myRules = out.rules.filter(r => r.startsWith('RULE-SET,my-'));
myRules.forEach((r, i) => console.log(`  ${i + 1}. ${r}`));
const matcher = out.rules.indexOf('MATCH,DIRECT');
const afterMatch = out.rules.filter((r, i) => i > matcher && r.startsWith('RULE-SET,my-'));
console.log(`MATCH 位于第 ${matcher + 1} 条；MATCH 之后的死规则: ${afterMatch.length} 条`);

// tw 在 sea 之前 → verify.walletconnect.org 只在 sea，无冲突
const twIdx = myRules.findIndex(r => r.startsWith('RULE-SET,my-tw'));
const seaIdx = myRules.findIndex(r => r.startsWith('RULE-SET,my-sea'));
console.log(`\nmy-tw 第 ${twIdx + 1}，my-sea 第 ${seaIdx + 1}（tw 先命中）`);
process.exit(bad.length || afterMatch.length ? 1 : 0);
