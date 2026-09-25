// Local-only screenshot fixture. Requires a separately built application, never production.
const fs = require('node:fs/promises');
const path = require('node:path');
const net = require('node:net');
const { spawn, execFileSync } = require('node:child_process');
const { createRequire } = require('node:module');
const { randomBytes, createHash } = require('node:crypto');
const assert = require('node:assert/strict');
const repository = path.resolve(__dirname, '..');
const app = path.resolve(process.env.GOLDCUBE_PREVIEW_APP_BUILD || '');
const evidence = path.resolve(process.env.GOLDCUBE_PREVIEW_EVIDENCE || '');
const beforeCommit = process.env.GOLDCUBE_PREVIEW_BASE_COMMIT;
if (!process.env.GOLDCUBE_PREVIEW_APP_BUILD || !process.env.GOLDCUBE_PREVIEW_EVIDENCE) throw new Error('Set isolated GOLDCUBE_PREVIEW_APP_BUILD and private GOLDCUBE_PREVIEW_EVIDENCE');
if (!/^[a-f0-9]{40}$/.test(beforeCommit || '')) throw new Error('Set exact GOLDCUBE_PREVIEW_BASE_COMMIT for immutable before-image evidence');
if (app === repository || evidence.startsWith(repository + path.sep)) throw new Error('App and evidence must be separate from Gateway');
const { chromium } = createRequire(path.join(app, 'package.json'))('@playwright/test');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
async function port() { const s = net.createServer(); await new Promise(r => s.listen(0, '127.0.0.1', r)); const p = s.address().port; await new Promise(r => s.close(r)); return p; }
const children = []; let browser;
function launch(args, cwd, env, ready) {
  const child = spawn(process.execPath, args, { cwd, env, windowsHide:true, stdio:['ignore','pipe','pipe'] }); children.push(child);
  return new Promise((resolve,reject) => {
    const timer=setTimeout(()=>reject(new Error('Local fixture startup timed out')),60000);
    child.stdout.on('data',d=>{if(d.toString().includes(ready)){clearTimeout(timer);resolve(child);}});
    child.stderr.on('data',()=>{}); // Never persist runtime secrets or customer content.
    child.once('exit',code=>{clearTimeout(timer);reject(new Error('Local fixture exited: '+code));});
  });
}
(async()=>{
  await fs.access(path.join(app,'.next','BUILD_ID'));
  const envFiles=(await fs.readdir(app)).filter(x=>/^\.env(?:\.|$)/.test(x)&&x!=='.env.example');
  assert.equal(envFiles.length,0,'Isolated build must not contain real environment files');
  await fs.mkdir(evidence,{recursive:true});
  const run=await fs.mkdtemp(path.join(evidence,'recapture-'));
  const guard=path.join(run,'loopback-only.cjs');
  await fs.writeFile(guard,`const net=require('node:net'),dns=require('node:dns');
const ok=h=>h===undefined||h==='localhost'||h==='127.0.0.1'||h==='::1';
const old=net.Socket.prototype.connect;net.Socket.prototype.connect=function(...args){let a=args[0];if(Array.isArray(a))a=a[0];const h=a&&typeof a==='object'?a.host:(typeof args[1]==='string'?args[1]:undefined);if(!ok(h))throw new Error('Fixture prohibits non-loopback sockets');return old.apply(this,args)};
const lookup=dns.lookup;dns.lookup=function(host,...args){if(!ok(host))throw new Error('Fixture prohibits external DNS');return lookup.call(this,host,...args)};
`);
  const appPort=await port();
  const origin='http://127.0.0.1:'+appPort;
  const installToken=randomBytes(24).toString('hex');
  const env=Object.fromEntries(['PATH','Path','SystemRoot','WINDIR','TEMP','TMP','USERPROFILE','APPDATA','LOCALAPPDATA'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
  Object.assign(env,{NODE_ENV:'production',NODE_OPTIONS:'--require='+guard,PORT:String(appPort),NEXT_PUBLIC_SITE_URL:origin,VOZEB_PRO_INTERNAL_ORIGIN:origin,VOZEB_PRO_WORKER_API_ORIGIN:origin,VOZEB_PRO_DATABASE_PROVIDER:'file',VOZEB_PRO_DATA_DIR:path.join(run,'data'),VOZEB_PRO_ENCRYPTION_KEY:randomBytes(32).toString('hex'),VOZEB_PRO_INSTALL_TOKEN:installToken,NEXT_TELEMETRY_DISABLED:'1'});
  await launch([path.join(app,'node_modules','next','dist','bin','next'),'start','-p',String(appPort),'-H','127.0.0.1'],app,env,'Ready');
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1440,height:900},locale:'zh-CN',timezoneId:'Asia/Shanghai'});
  let blockedExternal=0;
  const zero=keys=>Object.fromEntries(keys.split(' ').map(k=>[k,0]));
  const fixtures={
    '/api/billing/products':{products:[],paymentProviders:[]},
    '/api/billing/orders':{orders:[],total:0,page:1,pageSize:20},
    '/api/billing/coupons':{code:0,msg:'',data:{coupons:[],templates:[],total:0,templatesTotal:0,page:1,pageSize:20}},
    '/api/admin/referrals':{code:0,msg:'',data:{program:{enabled:false,inviterPoints:0,inviteeRewardType:'points',inviteePoints:0,minimumPaidCents:0,coolingOffDays:0},stats:zero('clicks registrations qualified pending settled risky')}},
    '/api/admin/billing/summary':{summary:{orders:zero('total pending paid closed canceled refunded grossAmountCents paidAmountCents pendingAmountCents refundedAmountCents'),payments:zero('succeeded refunded succeededAmountCents refundedAmountCents'),commerce:zero('convertedOrders promotionOrders promotionConvertedOrders promotionDiscountCents couponOrders couponConvertedOrders couponDiscountCents'),providers:[],reconciliation:zero('paidOrdersWithoutSucceededPayment succeededPaymentsWithoutPaidOrder amountMismatchPayments')}},
  };
  await fs.writeFile(path.join(run,'empty-commercial-api-fixtures.json'),JSON.stringify(fixtures,null,2));
  const fixtureCalls=[];
  await context.route('**/*',r=>{const u=new URL(r.request().url());if(u.protocol==='http:'&&u.hostname==='127.0.0.1'&&[String(appPort)].includes(u.port)){if(fixtures[u.pathname]&&r.request().method()==='GET'){fixtureCalls.push(u.pathname);return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(fixtures[u.pathname])});}return r.continue();}if(['data:','blob:'].includes(u.protocol))return r.continue();blockedExternal++;return r.abort();});
  const registration=await context.request.post(origin+'/api/auth/register',{data:{username:'source_demo',email:'source-demo@example.invalid',displayName:'源码演示账号',password:randomBytes(24).toString('base64'),installToken}});
  assert.equal(registration.status(),200,'Synthetic fixture registration must succeed');
  const account=await registration.json();assert.equal(account.user.username,'source_demo');
  const page=await context.newPage();
  const targets=[
    {file:'docs/public/screenshots/pages/20-admin-overview.webp',url:origin+'/admin',heading:'经营看板',required:['/api/admin/referrals']},
    {file:'docs/public/screenshots/pages/21-admin-users.webp',url:origin+'/admin?section=users',heading:'用户管理',required:[]},
    {file:'docs/public/screenshots/pages/31-admin-settings.webp',url:origin+'/admin?section=settings',heading:'系统设置',required:[]},
  ];
  const results=[];
  for(const target of targets){
    console.log('Capturing '+target.file);
    // File-provider dashboards deliberately skip billing summary; wait only for requests the real page issues.
    const required=target.url.includes('section=users')?['/api/admin/users']:target.required;
    const apiReady=Promise.all(required.map(p=>page.waitForResponse(r=>new URL(r.url()).pathname===p&&r.status()===200).catch(()=>{throw new Error('Missing successful fixture response '+p+' on '+target.file)})));
    const response=await page.goto(target.url,{waitUntil:'domcontentloaded'});assert.equal(response.status(),200);
    assert.equal(new URL(page.url()).pathname,new URL(target.url).pathname,'Unexpected login/install redirect');
    assert.equal(new URL(page.url()).search,new URL(target.url).search,'Unexpected profile section');
    await fs.writeFile(path.join(run,path.basename(target.file)+'.rendered.txt'),await page.locator('body').innerText());
    await page.getByText(target.heading,{exact:false}).filter({visible:true}).first().waitFor({state:'visible'});
    await apiReady;
    if(target.url.includes('section=users')) await page.getByRole('textbox',{name:'搜索用户'}).waitFor({state:'visible'});
    if(target.url.includes('section=settings')) await page.locator('main input').first().waitFor({state:'visible'});
    await page.getByText('正在加载分区...', {exact:true}).waitFor({state:'hidden'});
    await fs.writeFile(path.join(run,path.basename(target.file)+'.ready.txt'),await page.locator('body').innerText());
    if(new URL(target.url).pathname==='/create') await page.getByText('正在加载创作 Skill...', {exact:true}).waitFor({state:'hidden'});
    if(target.url.includes('section=billing')) await page.getByText('暂无已上架套餐商品',{exact:true}).waitFor({state:'visible'});
    await page.waitForFunction(()=>![...document.querySelectorAll('.ant-spin-spinning,.animate-spin,.ant-message-notice')].some(e=>e.getBoundingClientRect().height&&getComputedStyle(e).visibility!=='hidden'));
    assert(!/邀请数据异常|商业订单需要启用|加载失败/.test(await page.locator('body').innerText()),'Preview must not contain error state');
    await page.evaluate(()=>document.fonts.ready);
    const text=await page.locator('body').innerText();assert(!text.includes('@')||!text.match(/[\w.+-]+@(?!example\.invalid)[\w.-]+\.[a-z]{2,}/i),'Only reserved-domain synthetic email may appear');
    const destination=path.join(repository,target.file);const before=execFileSync('git',['--no-replace-objects','show',beforeCommit+':'+target.file],{cwd:repository,env:{...process.env,GIT_NO_LAZY_FETCH:'1'},maxBuffer:10*1024*1024});
    const screenshot=path.join(run,path.basename(target.file).replace('.webp','.png'));
    await page.waitForLoadState('networkidle');
    if(target.url.includes('section=users')) await page.getByRole('textbox',{name:'搜索用户'}).waitFor({state:'visible'});
    if(target.url.includes('section=settings')) await page.getByRole('button',{name:'保存系统设置',exact:true}).waitFor({state:'visible'});
    if(target.url.includes('section=settings')) await page.getByPlaceholder('name@example.com',{exact:true}).fill('source-demo@example.invalid'); // Unsaved synthetic SMTP form value, no test mail or save.
    await page.getByText('正在加载分区...', {exact:true}).waitFor({state:'hidden'});
    assert(!(await page.locator('body').innerText()).includes('正在加载分区'),'Section must be ready');
    await page.evaluate(async()=>{await Promise.all(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));});
    await page.screenshot({path:screenshot,fullPage:false});
    const sharp=createRequire(path.join(app,'package.json'))('sharp');
    sharp.concurrency(1);sharp.cache(false);
    const after=await sharp(screenshot).webp({lossless:true,effort:0}).toBuffer();
    await fs.writeFile(path.join(run,path.basename(target.file)),after);
    // Only after the page checks succeed, replace the explicitly authorized image.
    await fs.writeFile(destination,after);
    results.push({path:target.file,beforeCommit,oldSha256:hash(before),newSha256:hash(after),route:new URL(target.url).pathname+new URL(target.url).search,branded:false,viewport:{width:1440,height:900},screenshot,fixture:'Real components + new file-provider synthetic administrator + explicit browser empty commercial API fixtures; no real channels/orders/tasks/customer data. Not a commerce backend functional test.',status:'recaptured-awaiting-independent-visual-review'});
  }
  await fs.writeFile(path.join(evidence,'r18-app-recapture-v4.json'),JSON.stringify({applicationBuildId:(await fs.readFile(path.join(app,'.next','BUILD_ID'),'utf8')).trim(),applicationBuildDirectory:app,scriptSha256:hash(await fs.readFile(__filename)),fixtureDirectory:run,commercialApiFixtures:fixtures,fixtureCalls,networkPolicy:'Browser allowlists only one loopback origin; Node child process reject external sockets and DNS',blockedExternalBrowserRequests:blockedExternal,results},null,2));
  console.log('Recaptured '+results.length+' real component previews with synthetic local data.');
})().finally(async()=>{await browser?.close();for(const c of children)c.kill();}).catch(e=>{console.error(e.message);process.exitCode=1;});
