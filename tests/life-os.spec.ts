import {test,expect} from '@playwright/test';
import type {Entry,Store} from '../src/lib/types';

test('dashboard, editable task, quick entry and responsive workspace',async({page})=>{
 await page.setViewportSize({width:1440,height:1100});
 await page.goto('/');
 await expect(page.getByRole('heading',{name:'生活驾驶舱.'})).toBeVisible();
 await expect(page.getByText('正在整理你的生活空间…')).not.toBeVisible();
 await expect(page.locator('.welcome-banner')).toBeVisible();
 await page.screenshot({path:'/tmp/life-os-desktop.png',fullPage:true});
 await page.getByRole('button',{name:'添加今日任务'}).click();
 await page.getByLabel('名称').fill('浏览器验证 · 认真生活');
 await page.getByRole('button',{name:'保存记录'}).click();
 await expect(page.getByRole('dialog')).not.toBeVisible();
 await page.goto('/tasks');
 await expect(page.getByText('浏览器验证 · 认真生活')).toBeVisible();
 const row=page.locator('.task-row').filter({hasText:'浏览器验证 · 认真生活'});
 await row.getByRole('button',{name:'完成任务',exact:true}).click();
 await expect(row).toHaveClass(/done/);
 await page.reload();
 await expect(page.locator('.task-row').filter({hasText:'浏览器验证 · 认真生活'})).toHaveClass(/done/);
 await page.goto('/');
 await page.setViewportSize({width:390,height:844});
 await expect(page.locator('.mobile-bottom-nav')).toBeVisible();
 await expect(page.locator('.welcome-banner')).toBeVisible();
 await page.screenshot({path:'/tmp/life-os-mobile.png',fullPage:true,animations:'disabled'});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 await page.locator('.mobile-add').click();
 await expect(page.getByRole('heading',{name:'此刻，想记点什么？'})).toBeVisible();
 await page.locator('.quick-grid').getByRole('button',{name:'睡眠'}).click();
 await expect(page.getByLabel('睡眠时长（小时）')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('account isolation, unique daily records and CRUD persistence',async({playwright})=>{
 const baseURL=process.env.TEST_BASE_URL||'http://localhost:3000';
 const a=await playwright.request.newContext({baseURL});const b=await playwright.request.newContext({baseURL});
 const suffix=Date.now();
 for(const [context,tag] of [[a,'a'],[b,'b']] as const){const response=await context.post('/api/auth',{data:{action:'register',email:`test-${tag}-${suffix}@example.com`,password:'SafeTestPassword1!',name:`测试 ${tag}`}});expect(response.ok()).toBeTruthy();}
 const initial:Store=await(await a.get('/api/data')).json();expect(initial.records.tasks).toHaveLength(0);
 const date=new Date().toISOString().slice(0,10);
 expect((await a.post('/api/data',{data:{kind:'tasks',date,data:{title:'私有任务',priority:'高优先级',status:'未开始'}}})).ok()).toBeTruthy();
 const data:Store=await(await a.get('/api/data')).json();const task=data.records.tasks[0];expect(task.data.title).toBe('私有任务');
 expect((await b.post('/api/data',{data:{kind:'tasks',id:task.id,date,data:{title:'越权修改'}}})).status()).toBe(404);
 expect((await b.post('/api/data',{data:{kind:'tasks',id:task.id,action:'delete'}})).status()).toBe(404);
 const other:Store=await(await b.get('/api/data')).json();expect(other.records.tasks).toHaveLength(0);
 for(const hours of [7,8])expect((await a.post('/api/data',{data:{kind:'sleep',date,data:{hours,energy:8,mood:8,quality:8}}})).ok()).toBeTruthy();
 const after:Store=await(await a.get('/api/data')).json();expect(after.records.sleep).toHaveLength(1);expect(after.records.sleep[0].data.hours).toBe(8);
 for(const kind of ['fitness','finance','journal','weekly','projects','study']){
 const payloads:Record<string,unknown>={fitness:{title:'训练测试',workout:'胸部',duration:45,exercises:[{name:'卧推',sets:3,reps:10,weight:30,rir:2}]},finance:{title:'晚饭',amount:25,type:'支出',category:'餐饮'},journal:{wins:'今天完成测试',score:8},weekly:{description:'本周完成了系统测试',next:'持续迭代'},projects:{title:'测试主线',progress:30,status:'进行中'},study:{title:'文献阅读',duration:30,progress:20}};
 const result=await a.post('/api/data',{data:{kind,date,data:payloads[kind]}});expect(result.ok(),`${kind}: ${await result.text()}`).toBeTruthy();
 }
 expect((await a.post('/api/data',{data:{kind:'finance',date,data:{title:'错误金额',amount:-1}}})).status()).toBe(400);
 expect((await a.post('/api/data',{data:{kind:'tasks',id:task.id,action:'delete'}})).ok()).toBeTruthy();
 expect((await(await a.get('/api/data')).json()).records.tasks).toHaveLength(0);
 expect((await a.post('/api/auth',{data:{action:'logout'}})).ok()).toBeTruthy();
 expect((await a.post('/api/data',{data:{kind:'tasks',date,data:{title:'未登录写入'}}})).status()).toBe(401);
 expect((await a.post('/api/auth',{data:{action:'login',email:`test-a-${suffix}@example.com`,password:'SafeTestPassword1!'}})).ok()).toBeTruthy();
 expect((await(await a.get('/api/data')).json()).profile.email).toBe(`test-a-${suffix}@example.com`);
 await a.dispose();await b.dispose();
});
