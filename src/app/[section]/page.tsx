import {notFound} from 'next/navigation';
import LifeApp from '@/components/LifeApp';
const sections=['dashboard','tasks','projects','fitness','sleep','finance','journal','weekly','study','profile','review'];
export default async function Page({params}:{params:Promise<{section:string}>}){const {section}=await params;if(!sections.includes(section))notFound();return <LifeApp section={section==='review'?'journal':section}/>;}
