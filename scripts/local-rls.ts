import 'dotenv/config';
import {sql} from 'drizzle-orm';
import {db,pool} from '../src/db';
const records=['projects','tasks','fitness_sessions','sleep_logs','finance_records','daily_reviews','weekly_reviews','study_entries'];
async function main(){
 await db.execute(sql.raw(`CREATE OR REPLACE FUNCTION public.life_local_user_id() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('app.user_id',true),'')::uuid $$`));
 for(const name of [...records,'profiles','life_sessions']){
  await db.execute(sql.raw(`ALTER TABLE "${name}" ENABLE ROW LEVEL SECURITY`));
  await db.execute(sql.raw(`ALTER TABLE "${name}" FORCE ROW LEVEL SECURITY`));
  await db.execute(sql.raw(`DROP POLICY IF EXISTS owner_isolation ON "${name}"`));
  const column=name==='profiles'?'id':'user_id';
  await db.execute(sql.raw(`CREATE POLICY owner_isolation ON "${name}" FOR ALL USING (public.life_local_user_id() = "${column}") WITH CHECK (public.life_local_user_id() = "${column}")`));
 }
 console.log('Local RLS enabled on all ten tables. API ownership checks remain mandatory.');
 await pool.end();
}
main().catch(e=>{console.error(e);process.exit(1);});
