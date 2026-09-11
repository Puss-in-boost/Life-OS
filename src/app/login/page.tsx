import AuthForm from '@/components/AuthForm';
import {hasSupabase} from '@/lib/supabase';
export const dynamic='force-dynamic';
export default function Login(){return <AuthForm demoAllowed={!hasSupabase()&&process.env.ALLOW_DEMO!=='false'}/>;}
