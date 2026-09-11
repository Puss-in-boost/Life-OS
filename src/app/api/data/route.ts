import {NextResponse} from 'next/server';
import {and,eq,desc,sql} from 'drizzle-orm';
import {db} from '@/db';
import {profiles,tables} from '@/db/schema';
import {identity,publicProfile,sameOrigin} from '@/lib/auth';
import {hasSupabase} from '@/lib/supabase';
import {createGuest} from '@/lib/seed';
import {modules,weekStart} from '@/lib/config';
import type {Kind,EntryData} from '@/lib/types';
import {z} from 'zod';
export const dynamic='force-dynamic';
const kinds=Object.keys(tables) as Kind[];
export async function GET(){try{let user=await identity();if(!user && !hasSupabase() && process.env.ALLOW_DEMO!=='false')user=await createGuest();if(!user)return NextResponse.json({error:'请先登录'},{status:401});const owner=user;
 const records=await db.transaction(async tx=>{await tx.execute(sql`select set_config('app.user_id', ${owner.id}, true)`);return Object.fromEntries(await Promise.all(kinds.map(async kind=>[kind,await tx.select().from(tables[kind]).where(eq(tables[kind].userId,owner.id)).orderBy(desc(tables[kind].date),desc(tables[kind].createdAt))])));});
 return NextResponse.json({profile:publicProfile(user),records,authMode:hasSupabase()?'supabase':'local'},{headers:{'Cache-Control':'no-store'}});
 }catch(e){console.error(e);return NextResponse.json({error:'数据加载失败，请稍后重试'},{status:500});}}
export async function POST(req:Request){
 if(!sameOrigin(req))return NextResponse.json({error:'请求来源不允许'},{status:403});
 try {
 const user=await identity();if(!user)return NextResponse.json({error:'请先登录'},{status:401});
 const body=await req.json();
 if(body.kind==='profile') {const data=z.object({displayName:z.string().trim().min(1).max(60),budget:z.coerce.number().min(1).max(100000000)}).parse(body.data);await db.update(profiles).set({displayName:data.displayName,budget:String(data.budget)}).where(eq(profiles.id,user.id));return NextResponse.json({ok:true});}
 const kind=z.enum(['tasks','projects','fitness','sleep','finance','journal','weekly','study']).parse(body.kind);const table=tables[kind];
 const id=body.id?z.string().uuid().parse(body.id):undefined;
 return await db.transaction(async tx=>{
 await tx.execute(sql`select set_config('app.user_id', ${user.id}, true)`);
 if(body.action==='delete'){if(!id)throw new Error('记录 ID 缺失');const rows=await tx.delete(table).where(and(eq(table.id,id),eq(table.userId,user.id))).returning();if(!rows.length)return NextResponse.json({error:'记录不存在'},{status:404});return NextResponse.json({ok:true});}
 let date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(body.date);const parsedDate=new Date(`${date}T12:00:00Z`);if(Number.isNaN(parsedDate.getTime())||parsedDate.toISOString().slice(0,10)!==date)throw new Error('日期无效');if(kind==='weekly')date=weekStart(date);
 const raw=z.record(z.string(),z.unknown()).parse(body.data);const data:Record<string,unknown>={};
 for(const field of modules[kind].fields){if(field.key==='date')continue;const value=raw[field.key];if(field.required && (value===undefined || value===''))throw new Error(`请填写${field.label}`);if(value===undefined || value==='')continue;
 if(field.type==='number') {const n=Number(value);if(!Number.isFinite(n)||n<(field.min??0)||n>(field.max??100000000))throw new Error(`${field.label}超出有效范围`);data[field.key]=n;}
 else {const str=z.string().max(10000).parse(value).trim();if(field.options&&!field.options.includes(str))throw new Error(`${field.label}无效`);data[field.key]=str;}}
 data.title=data.title || (kind==='journal'?'每日复盘':kind==='weekly'?'每周复盘':'睡眠记录');
 if(kind==='fitness')data.exercises=z.array(z.object({name:z.string().min(1).max(120),sets:z.coerce.number().int().min(1).max(100),reps:z.coerce.number().int().min(1).max(1000),weight:z.coerce.number().min(0).max(1000),rir:z.coerce.number().min(0).max(10)})).max(40).parse(raw.exercises||[]);
 if(data.projectId){const project=await tx.select().from(tables.projects).where(and(eq(tables.projects.id,z.string().uuid().parse(data.projectId)),eq(tables.projects.userId,user.id)));if(!project.length)throw new Error('所属主线不存在');}
 const values={userId:user.id,date,data:data as EntryData,updatedAt:new Date()};
 if(id){const rows=await tx.update(table).set(values).where(and(eq(table.id,id),eq(table.userId,user.id))).returning();if(!rows.length)return NextResponse.json({error:'记录不存在'},{status:404});}
 else if(['sleep','journal','weekly'].includes(kind))await tx.insert(table).values(values).onConflictDoUpdate({target:[table.userId,table.date],set:{data:values.data,updatedAt:new Date()}});
 else await tx.insert(table).values(values);
 return NextResponse.json({ok:true});
 });
 }catch(e){return NextResponse.json({error:e instanceof z.ZodError?'请检查填写内容':e instanceof Error?e.message:'保存失败，请重试'},{status:400});}
}
