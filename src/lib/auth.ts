import {cookies} from 'next/headers';
import {randomBytes, scryptSync, timingSafeEqual, createHash} from 'node:crypto';
import {and, eq, gt} from 'drizzle-orm';
import {db} from '@/db';
import {profiles,sessions} from '@/db/schema';
import {hasSupabase,supabase} from './supabase';
const options = {httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax' as const,path:'/'};
export function hashPassword(password:string) {const salt=randomBytes(16).toString('hex');return salt+':'+scryptSync(password,salt,64).toString('hex');}
export function verifyPassword(password:string,hash:string) {const [salt,key]=hash.split(':');const expected=Buffer.from(key,'hex');return expected.length===64 && timingSafeEqual(expected,scryptSync(password,salt,64));}
export async function createSession(userId:string) {const token=randomBytes(32).toString('hex');await db.insert(sessions).values({id:createHash('sha256').update(token).digest('hex'),userId,expiresAt:new Date(Date.now()+30*86400000)});(await cookies()).set('life_session',token,{...options,maxAge:30*86400});}
export async function setSupabaseSession(access:string,refresh:string) {const c=await cookies();c.set('life_access',access,{...options,maxAge:3600});c.set('life_refresh',refresh,{...options,maxAge:30*86400});}
export async function identity() {
 const c=await cookies();
 if(hasSupabase()) {
  const client=supabase(); const access=c.get('life_access')?.value;let user=access ? (await client.auth.getUser(access)).data.user : null;
  if(!user && c.get('life_refresh')?.value) {const {data}=await client.auth.refreshSession({refresh_token:c.get('life_refresh')!.value});if(data.session) {user=data.user;await setSupabaseSession(data.session.access_token,data.session.refresh_token);}}
  if(!user) return null;
  await db.insert(profiles).values({id:user.id,email:user.email,displayName:user.user_metadata.display_name || user.email?.split('@')[0] || '朋友'}).onConflictDoNothing();
  return (await db.select().from(profiles).where(eq(profiles.id,user.id)))[0] || null;
 }
 const token=c.get('life_session')?.value;if(!token)return null;
 const rows=await db.select({profile:profiles}).from(sessions).innerJoin(profiles,eq(sessions.userId,profiles.id)).where(and(eq(sessions.id,createHash('sha256').update(token).digest('hex')),gt(sessions.expiresAt,new Date())));
 return rows[0]?.profile || null;
}
export async function logout() {const c=await cookies();const token=c.get('life_session')?.value;if(token)await db.delete(sessions).where(eq(sessions.id,createHash('sha256').update(token).digest('hex')));if(hasSupabase() && c.get('life_access')?.value){const client=supabase();await client.auth.setSession({access_token:c.get('life_access')!.value,refresh_token:c.get('life_refresh')?.value||''});await client.auth.signOut();}for(const key of ['life_session','life_access','life_refresh'])c.delete(key);}
export function publicProfile(p:typeof profiles.$inferSelect) {return {id:p.id,email:p.email,displayName:p.displayName,budget:p.budget,guest:p.guest};}
export function sameOrigin(request:Request) {const origin=request.headers.get('origin');return !origin || origin===new URL(request.url).origin || origin===`${request.headers.get('x-forwarded-proto') || 'https'}://${request.headers.get('x-forwarded-host') || request.headers.get('host')}`;}
