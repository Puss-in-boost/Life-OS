import Link from 'next/link';
import {Leaf,ArrowLeft} from 'lucide-react';
export default function NotFound(){return <main className="empty-state" style={{minHeight:'100vh',justifyContent:'center',margin:0}}><Leaf size={40} color="#91a77c"/><div className="eyebrow" style={{marginTop:25}}>LIFE OS · 404</div><h2>这条小路，暂时还没开辟。</h2><p>回到生活驾驶舱，继续今天的一小步。</p><Link className="primary-button" href="/"><ArrowLeft size={16}/>回到首页</Link></main>;}
