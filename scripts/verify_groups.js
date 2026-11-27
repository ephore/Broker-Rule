// 校验策略组 / 节点引用完整性
const fs = require('fs');
const path = process.argv[2];
const src = fs.readFileSync(path, 'utf8');

const fn = new Function('module', 'exports', src + '\n;return typeof main === "function" ? main : null;');
const main = fn({ exports: {} }, {});

// mock 里放该订阅真实存在的节点名，用于检查分组引用的节点是否存在
const NODES = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const cfg = {
  proxies: NODES.map(n => ({ name: n, type: 'ss', server: 'x', port: 1, cipher: 'aes-128-gcm', password: 'x' })),
  'proxy-groups': [],
  'rule-providers': {},
  rules: ['MATCH,DIRECT']
};
const out = main(cfg);

const groupNames = new Set(out['proxy-groups'].map(g => g.name));
const nodeNames = new Set(NODES);

console.log('=== 策略组 ===');
out['proxy-groups'].forEach(g => {
  const missing = g.proxies.filter(p => !nodeNames.has(p) && !groupNames.has(p) && p !== 'DIRECT' && p !== 'REJECT');
  console.log(`  ${g.name.padEnd(14)} ${String(g.proxies.length).padStart(2)} 个成员${missing.length ? '  ⚠️ 不存在: ' + missing.join(', ') : ''}`);
});

// 规则引用的策略是否都存在
const policies = new Set();
out.rules.forEach(r => {
  const parts = r.split(',');
  if (parts[0] === 'RULE-SET') policies.add(parts[2]);
  else if (parts[0] === 'MATCH') policies.add(parts[1]);
  else policies.add(parts[2]);
});
const known = new Set([...groupNames, 'DIRECT', 'REJECT', 'PROXY', 'PASS', ...nodeNames]);
const unknown = [...policies].filter(p => p && !known.has(p));
console.log('\n=== 规则引用的策略 ===');
console.log('  ' + [...policies].filter(Boolean).join(' | '));
console.log(unknown.length ? '  ⚠️ 未定义: ' + unknown.join(', ') : '  全部有定义 ✓');

// 空转分组：没有任何规则指向它
const used = new Set();
out.rules.forEach(r => { const p = r.split(','); used.add(p[0] === 'RULE-SET' ? p[2] : p[0] === 'MATCH' ? p[1] : p[2]); });
const dead = [...groupNames].filter(g => !used.has(g));
console.log('\n=== 无规则引用的分组 ===');
console.log(dead.length ? '  ⚠️ ' + dead.join(', ') : '  无 ✓');

const bad = unknown.length + dead.length +
  out['proxy-groups'].reduce((a, g) => a + g.proxies.filter(p => !nodeNames.has(p) && !groupNames.has(p) && p !== 'DIRECT' && p !== 'REJECT').length, 0);
console.log('\n结果:', bad === 0 ? 'PASS' : `FAIL (${bad} 处问题)`);
process.exit(bad === 0 ? 0 : 1);
