const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.join(__dirname,'..'),src=fs.readFileSync(path.join(root,'scripts/kuaidi100.js'),'utf8');
const rules=fs.readFileSync(path.join(root,'kuaidi100.snippet'),'utf8').split('\n').filter(x=>x.startsWith('^')).map(x=>({re:new RegExp(x.split(' url ')[0]),action:x.split(' url ')[1]}));
const count={entries:0,dict:0,float:0,sdk:0,ads:0,pass:0};
function run(url,body){let result,calls=0;vm.runInNewContext(src,{$request:{url},$response:{body},$done:r=>{result=r;calls++;}});assert.equal(calls,1);return result;}
for(const file of process.argv.slice(2))for(const e of JSON.parse(fs.readFileSync(file)).log.entries){
 count.entries++;const url=e.request.url,c=e.response.content||{};
 const body=c.encoding==='base64'?Buffer.from(c.text||'','base64').toString():c.text||'';
 const result=run(url,body);if(!result.body){count.pass++;continue;}
 assert(rules.some(r=>r.re.test(url)&&r.action.startsWith('script-response-body')));
 const before=JSON.parse(body),after=JSON.parse(result.body),u=new URL(url);
 if(u.hostname==='ad.api.open.jihuoniao.com'){
  const expected=JSON.parse(body);expected.data.jihuoniao_allow=0;assert.deepStrictEqual(after,expected);count.sdk++;
 }else if(u.pathname.startsWith('/advertisement/ad/')){
  const expected=JSON.parse(body);expected.data.list=[];assert.deepStrictEqual(after,expected);count.ads++;
 }else if(u.searchParams.get('method')==='dictItemsByCode'){
  const expected=JSON.parse(body);expected.data=expected.data.filter(x=>!x||x.dictCode!=='wx_ad_config');assert.deepStrictEqual(after,expected);count.dict++;
 }else{
  const expected=JSON.parse(body);['icon','path','iOSPath','androidPath'].forEach(k=>expected.data[k]='');assert.deepStrictEqual(after,expected);count.float++;
 }
}
assert(count.sdk&&count.ads&&count.dict&&count.float);
const url='https://p.kuaidi100.com/apicenter/kdmkt.do?method=dictItemsByCode';
for(const status of [200,'200'])assert.deepStrictEqual(JSON.parse(run(url,JSON.stringify({status,data:[{dictCode:'wx_ad_config'},{dictCode:'business'}]})).body).data,[{dictCode:'business'}]);
assert(!run(url,'{invalid').body);assert(!run(url,JSON.stringify({status:403,data:null})).body);
const sdk='https://ad.api.open.jihuoniao.com/api/jihuoniao/v1/ad/ad_config';
assert(!run(sdk,'').body);assert(!run(sdk,JSON.stringify({code:500,data:null})).body);
for(const url of ['https://p.kuaidi100.com/apicenter/order.do?method=countByStatus','https://sso.kuaidi100.com/xcx/silenceAuth','https://cdn.kuaidi100.com/images/open/appads/business.png','https://wximg.wxs.qq.com/image.jpg'])assert(!rules.some(r=>r.re.test(url)));
console.log(JSON.stringify(count,null,2));
