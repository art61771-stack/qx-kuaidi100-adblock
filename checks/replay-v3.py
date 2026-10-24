import json,re,sys,subprocess,base64,pathlib,collections
root=pathlib.Path(__file__).resolve().parent.parent
rules=[]
for line in (root/'kuaidi100.snippet').read_text().splitlines():
 if not line.startswith('^'):continue
 regex,action=line.split(' url ',1)
 rules.append((re.compile(regex),action))
counts=collections.Counter()
for file in sys.argv[1:]:
 for e in json.load(open(file))['log']['entries']:
  counts['entries']+=1;url=e['request']['url'];hits=[a for r,a in rules if r.search(url)]
  assert len(hits)<=1,(url,hits)
  c=e['response'].get('content',{});body=c.get('text','')
  if c.get('encoding')=='base64':
   try:body=base64.b64decode(body).decode()
   except UnicodeDecodeError:body=''
  if not hits:counts['unmatched']+=1;continue
  action=hits[0]
  if action=='reject-img':counts['float_image']+=1;continue
  assert action.startswith("jsonjq-response-body '")
  filt=action[len("jsonjq-response-body '"):-1]
  try:before=json.loads(body)
  except (ValueError,TypeError):counts['non_json']+=1;continue
  p=subprocess.run(['jq','-c',filt],input=body,text=True,capture_output=True)
  assert p.returncode==0,p.stderr
  after=json.loads(p.stdout);expected=json.loads(body)
  if 'dictItemsByCode' in url:
   expected['data']=[x for x in expected['data'] if x.get('dictCode')!='wx_ad_config'];counts['dict']+=1
  elif 'dictItemDescByCodeAndVal' in url:
   for k in ['icon','path','iOSPath','androidPath']:expected['data'][k]=''
   counts['float']+=1
  elif '/advertisement/ad/' in url:expected['data']['list']=[];counts['ads']+=1
  elif '/ad/ad_config' in url:expected['data']['jihuoniao_allow']=0;counts['sdk']+=1
  assert after==expected,(url,after,expected)
for regex,action in rules:
 if not action.startswith('jsonjq-response-body'):continue
 filt=action[len("jsonjq-response-body '"):-1]
 for sample in [{'status':403,'data':None},{'code':500,'data':None},{'status':200,'data':None}]:
  p=subprocess.run(['jq','-c',filt],input=json.dumps(sample),text=True,capture_output=True)
  assert p.returncode==0,p.stderr
  assert json.loads(p.stdout)==sample
assert counts['dict']==5 and counts['sdk']>=1 and counts['ads']>=3
print(json.dumps(dict(counts),indent=2))
