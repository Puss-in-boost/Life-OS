import {db} from '@/db';
import {profiles,tables} from '@/db/schema';
import {createSession} from './auth';
import {dayOffset,today} from './config';
import type {EntryData,Kind} from './types';
export async function createGuest() {
 const [profile]=await db.insert(profiles).values({displayName:'林屿',guest:'true',budget:'5000'}).returning();
 await db.transaction(async tx=>{
 const add = async(kind:Kind,data:EntryData,date=today()) => (await tx.insert(tables[kind]).values({userId:profile.id,date,data}).returning())[0];
 const thesis=await add('projects',{title:'完成毕业论文',description:'把想法变成有价值的研究',progress:68,color:'紫色',phase:'第三章 · 实验与分析',next:'完成第三章实验结果分析',status:'进行中'},dayOffset(40));
 const work=await add('projects',{title:'个人产品设计',description:'做一个真正有用的个人作品',progress:45,color:'绿色',phase:'产品设计',next:'完善核心页面交互方案',status:'进行中'},dayOffset(25));
 await add('projects',{title:'建立长期运动习惯',progress:75,color:'橙色',phase:'力量提升期',next:'完成本周第 3 次力量训练',status:'进行中'},dayOffset(60));
 await add('projects',{title:'英语能力进阶',progress:32,color:'蓝色',phase:'每天一点输入',next:'阅读一篇英文文章',status:'进行中'},dayOffset(90));
 await add('tasks',{title:'完成论文第三章实验分析',projectId:thesis.id,priority:'高优先级',status:'进行中',estimated:90,description:'整理实验数据，完成对比分析与结论。'});
 await add('tasks',{title:'完成产品首页设计稿',projectId:work.id,priority:'高优先级',status:'未开始',estimated:60});
 await add('tasks',{title:'背部力量训练 · 45 分钟',priority:'中优先级',status:'未开始',estimated:45});
 await add('tasks',{title:'阅读 20 分钟，做一点输入',priority:'低优先级',status:'已完成',estimated:20});
 await add('tasks',{title:'整理本周文献笔记',priority:'中优先级',status:'未开始',estimated:30},dayOffset(2));
 for(let i=1;i<7;i++) for(let j=0;j<[0,3,4,3,4,2,3][i];j++) await add('tasks',{title:['阅读文献','完善设计方案','英语听力','整理学习笔记'][j%4],priority:'中优先级',status:j===0&&i%2===0?'未开始':'已完成',estimated:30},dayOffset(-i));
 for(let i=6;i>=0;i--) await add('sleep',{title:'睡眠记录',hours:[7.5,7.2,6.8,7,6.5,7.8,7.2][i],energy:[8,8,7,7,6,8,7][i],quality:8,mood:8,bedtime:'23:30',wake:'07:00'},dayOffset(-i));
 await add('fitness',{title:'胸部 + 三头力量训练',workout:'胸部',duration:50,feeling:'状态不错，注意肩部热身',exercises:[{name:'杠铃卧推',sets:4,reps:10,weight:40,rir:2}]},dayOffset(-1));
 await add('fitness',{title:'下肢力量训练',workout:'腿部',duration:45,feeling:'膝盖无不适',exercises:[{name:'深蹲',sets:4,reps:10,weight:50,rir:2}]},dayOffset(-3));
 const expenses=[['午餐 · 健康轻食',38,'餐饮',0],['咖啡与一点灵感',26,'餐饮',0],['地铁通勤',8,'交通',0],['生活日用品',168,'购物',-1],['和朋友的晚餐',186,'餐饮',-2],['专业书籍',89,'学习',-3],['周末电影',65,'娱乐',-4],['每月房租',1800,'居住',-5],['日常餐饮',106,'餐饮',-6]];
 for(const [title,amount,category,offset] of expenses) await add('finance',{title:String(title),amount:Number(amount),category:String(category),type:'支出'},dayOffset(Number(offset)));
 await add('journal',{title:'给认真生活的自己一点肯定',wins:'推进了论文实验，也按计划完成了训练。',problems:'下午有些分心，明天试试番茄钟。',gratitude:'傍晚散步时的风很舒服。慢慢来，也是在向前。',tomorrow:'完成实验分析\n首页设计稿\n背部训练',score:8,energy:8,mood:8},dayOffset(-1));
 await add('study',{title:'第三章 · 实验结果与分析',type:'论文章节',progress:68,duration:90,understanding:8,description:'补充消融实验结果图表',next:'完成对比实验分析'});
 await add('study',{title:'Atomic Habits 英文阅读',type:'学习主题',progress:32,duration:25,understanding:7,next:'继续阅读第四章'},dayOffset(-1));
 });
 await createSession(profile.id);return profile;
}
