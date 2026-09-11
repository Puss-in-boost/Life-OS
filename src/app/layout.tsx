import type {Metadata,Viewport} from 'next';
import './globals.css';
export const metadata:Metadata={title:{default:'Life OS · 把生活，慢慢理清',template:'%s | Life OS'},description:'你的个人生活驾驶舱。管理任务、长期主线、健康、财务与复盘，按自己的节奏认真生活。',manifest:'/manifest.webmanifest',applicationName:'Life OS',appleWebApp:{capable:true,statusBarStyle:'default',title:'Life OS'},icons:{icon:'/icons/icon-192.png',apple:'/icons/icon-192.png'},formatDetection:{telephone:false}};
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#617c58'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body>{children}</body></html>;}
