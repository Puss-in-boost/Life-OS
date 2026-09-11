import type {Store} from './types';
import {today,weekStart,dayOffset} from './config';
export function statistics(store:Store){
 const r=store.records;const day=today();const start=weekStart();const month=day.slice(0,7);
 const tasks=r.tasks.filter(x=>x.date===day);const weeklyTasks=r.tasks.filter(x=>x.date>=start&&x.date<=day);
 const monthFinance=r.finance.filter(x=>x.date.startsWith(month)&&x.date<=day);
 const spent=monthFinance.filter(x=>x.data.type!=='收入').reduce((a,x)=>a+(x.data.amount||0),0);
 const income=monthFinance.filter(x=>x.data.type==='收入').reduce((a,x)=>a+(x.data.amount||0),0);
 const sleep=r.sleep.filter(x=>x.date>=start&&x.date<=day);
 const workouts=r.fitness.filter(x=>x.date>=start&&x.date<=day&&x.data.workout!=='休息');
 const weekSpent=r.finance.filter(x=>x.date>=start&&x.date<=day&&x.data.type!=='收入').reduce((a,x)=>a+(x.data.amount||0),0);
 const learning=r.study.filter(x=>x.date>=start&&x.date<=day).reduce((a,x)=>a+(x.data.duration||0),0);
 const avgSleep=sleep.length?sleep.reduce((a,x)=>a+(x.data.hours||0),0)/sleep.length:0;
 const latestSleep=r.sleep.find(x=>x.date<=day);
 const categories:Record<string,number>={};monthFinance.filter(x=>x.data.type!=='收入').forEach(x=>{categories[x.data.category||'其他']=(categories[x.data.category||'其他']||0)+(x.data.amount||0);});
 let streak=0;for(let i=0;i<366;i++){if(r.tasks.some(x=>x.date===dayOffset(-i)&&x.data.status==='已完成'))streak++;else break;}
 return {tasks,done:tasks.filter(x=>x.data.status==='已完成').length,weeklyTasks,weeklyDone:weeklyTasks.filter(x=>x.data.status==='已完成').length,spent,income,budget:Number(store.profile.budget),weekSpent,workouts,learning,avgSleep,latestSleep,categories,streak};
}
export function getInsights(store:Store){
 const s=statistics(store);const r=store.records;const insights:{tone:string;title:string;text:string;link:string}[]=[];
 if([0,1,2].every(i=>r.sleep.some(x=>x.date===dayOffset(-i)&&(x.data.hours||0)<6)))insights.push({tone:'orange',title:'今晚，把睡眠放在前面',text:'连续 3 天睡眠不足 6 小时，今天可以适当减少任务，给身体一点恢复的时间。',link:'sleep'});
 if(s.spent>=s.budget*.85)insights.push({tone:'orange',title:'给预算留一点呼吸空间',text:`本月已使用 ${Math.round(s.spent/s.budget*100)}% 的预算，下次消费前，不妨再想一想。`,link:'finance'});
 if(s.avgSleep>=7 && s.latestSleep && (s.latestSleep.data.energy||0)>=7)insights.push({tone:'green',title:'好好休息，真的会有回报',text:`本周平均睡眠 ${s.avgSleep.toFixed(1)} 小时，最近精力 ${s.latestSleep.data.energy}/10。保持这个节奏，身体正在给你积极反馈。`,link:'sleep'});
 if(s.weeklyTasks.length && s.weeklyDone/s.weeklyTasks.length<.5)insights.push({tone:'orange',title:'少一点计划，多一点完成',text:`本周已完成 ${s.weeklyDone}/${s.weeklyTasks.length} 项任务。先选择一件小事开始，不必一次做到所有。`,link:'tasks'});
 if(!s.workouts.length)insights.push({tone:'green',title:'动一动，也是一种充电',text:'这周还没有训练记录。从一次 20 分钟的散步开始，也很好。',link:'fitness'});
 const stale=r.projects.find(x=>x.data.status==='进行中'&&x.updatedAt&&x.updatedAt.slice(0,10)<dayOffset(-7));
 if(stale)insights.push({tone:'orange',title:'让长期主线重新动起来',text:`「${stale.data.title}」已有一周未更新，试着拆出一个今天就能完成的小行动。`,link:'projects'});
 if(!insights.length)insights.push({tone:'green',title:s.done?'每一小步，都算数':'今天，从一条记录开始',text:s.done?`今天已经完成 ${s.done} 件事。给自己的认真一点肯定，按自己的节奏继续。`:'记录睡眠、完成任务或写一段复盘，Life OS 会从你的真实记录中发现生活的变化。',link:s.done?'journal':'sleep'});
 return insights.slice(0,2);
}
