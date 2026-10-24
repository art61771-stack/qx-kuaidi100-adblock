const fs = require('fs'), vm = require('vm'), assert = require('assert'), path = require('path');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'scripts/kuaidi100.js'), 'utf8');
const lines = fs.readFileSync(path.join(root, 'kuaidi100.snippet'), 'utf8').split('\n');
const rules = lines.filter(l => l.startsWith('^')).map(l => ({re: new RegExp(l.split(' url ')[0]), action:l.split(' url ')[1]}));
let total = 0, cleaned = 0, slots = 0, floats = 0, unchanged = 0, sdk = 0, ad = 0, business = 0;
function run(url, body) {
  let result, calls = 0;
  vm.runInNewContext(source, {$request:{url},$response:{body},$done:r=>{result=r;calls++;}});
  assert.equal(calls,1); return result;
}
for (const file of process.argv.slice(2)) {
  for (const e of JSON.parse(fs.readFileSync(file)).log.entries) {
    total++;
    const url = e.request.url, u = new URL(url), c = e.response.content || {};
    const body = c.encoding === 'base64' ? Buffer.from(c.text || '', 'base64').toString() : c.text || '';
    const hits = rules.filter(r=>r.re.test(url));
    if (u.hostname === 'ad.api.open.jihuoniao.com') {assert.equal(e.response.status,404); assert.equal(hits.length,0); sdk++;}
    if (u.hostname === 'p.kuaidi100.com' && u.pathname.startsWith('/advertisement/ad/')) {assert.equal(e.response.status,404); assert.equal(hits.length,0); ad++;}
    if (u.hostname === 'cdn.kuaidi100.com' && u.pathname.startsWith('/images/open/appads/')) {assert.equal(hits.length,0);business++;}
    if (u.hostname !== 'p.kuaidi100.com' || u.pathname !== '/apicenter/kdmkt.do') continue;
    const result = run(url, body), method = u.searchParams.get('method');
    let obj; try {obj=JSON.parse(body);} catch (_) {assert(!result.body);continue;}
    if (method==='dictItemsByCode' && Array.isArray(obj.data) && obj.data.some(x=>x.dictCode==='wx_ad_config')) {
      assert(hits.some(r=>r.action.startsWith('script-response-body')));
      const out=JSON.parse(result.body); slots+=obj.data.filter(x=>x.dictCode==='wx_ad_config').length;
      assert.deepStrictEqual(out.data,obj.data.filter(x=>x.dictCode!=='wx_ad_config')); cleaned++;
    } else if(method==='dictItemDescByCodeAndVal' && u.searchParams.get('dictVal')==='index_activity_float_banner' && obj.status===200) {
      assert(hits.some(r=>r.action.startsWith('script-response-body')));assert.strictEqual(JSON.parse(result.body).data,null);floats++;
    } else {assert(!result.body);unchanged++;}
  }
}
const testUrl='https://p.kuaidi100.com/apicenter/kdmkt.do?x=1&method=dictItemsByCode';
assert(rules.some(r=>r.re.test(testUrl)));
const mixed={status:200,data:[{dictCode:'wx_ad_config'}, {dictCode:'BUSINESS',value:'keep'}]};
assert.deepStrictEqual(JSON.parse(run(testUrl,JSON.stringify(mixed)).body).data,[mixed.data[1]]);
assert(!run(testUrl,'invalid json').body);
assert(!run(testUrl,JSON.stringify({status:403,data:null})).body);
assert(!run('https://example.com/',JSON.stringify(mixed)).body);
assert(!rules.some(r=>r.re.test('https://p.kuaidi100.com/apicenter/order.do?method=countByStatus')));
assert(!rules.some(r=>r.re.test('https://sso.kuaidi100.com/xcx/silenceAuth')));
assert(cleaned > 0 && sdk > 0 && ad > 0 && business > 0);
console.log(JSON.stringify({total,cleaned,slots,floats,unchanged,sdk,ad,business,syntheticChecks:'passed'},null,2));
