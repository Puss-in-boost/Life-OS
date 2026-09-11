import {NextResponse} from 'next/server';
import {eq} from 'drizzle-orm';
import {db} from '@/db';
import {profiles} from '@/db/schema';
import {createSession,hashPassword,verifyPassword,logout,sameOrigin} from '@/lib/auth';
import {hasSupabase,supabase} from '@/lib/supabase';
import {setSupabaseSession} from '@/lib/auth';
import {z} from 'zod';
const attempts=new Map<string,{count:number;until:number}>();
export async function POST(req:Request){
 if(!sameOrigin(req))return NextResponse.json({error:'请求来源不允许'},{status:403});
 try {
 const body=await req.json();
 if(body.action==='logout'){await logout();return NextResponse.json({ok:true});}
 const input=z.object({email:z.string().email().max(254),password:z.string().min(8,'密码至少需要 8 位').max(128),action:z.enum(['login','register']),name:z.string().max(60).optional()}).parse(body);
 const email=input.email.toLowerCase().trim();const rate=attempts.get(email);if(rate && rate.until>Date.now() && rate.count>=10)return NextResponse.json({error:'尝试过于频繁，请 15 分钟后再试'},{status:429});
 attempts.set(email,{count:rate && rate.until>Date.now()?rate.count+1:1,until:Date.now()+900000});
 if(hasSupabase()){
 const client=supabase();const {data,error}= input.action==='register' ? await client.auth.signUp({email,password:input.password,options:{data:{display_name:input.name||email.split('@')[0]}}}) : await client.auth.signInWithPassword({email,password:input.password});
 if(error)return NextResponse.json({error:error.message},{status:400});
 if(data.session)await setSupabaseSession(data.session.access_token,data.session.refresh_token);
 return NextResponse.json({ok:true,confirmation:!data.session});
 }
 const existing=(await db.select().from(profiles).where(eq(profiles.email,email)))[0];
 if(input.action==='register'){
 if(existing)return NextResponse.json({error:'此邮箱已注册，请直接登录'},{status:409});
 const [profile]=await db.insert(profiles).values({email,displayName:input.name||email.split('@')[0],passwordHash:hashPassword(input.password)}).returning();await createSession(profile.id);
 }else {if(!existing?.passwordHash || !verifyPassword(input.password,existing.passwordHash))return NextResponse.json({error:'邮箱或密码不正确'},{status:401});await createSession(existing.id);}
 attempts.delete(email);return NextResponse.json({ok:true});
 }catch(error){return NextResponse.json({error:error instanceof z.ZodError?error.issues[0].message:'认证失败，请稍后重试'},{status:400});}
}
