import {LayoutDashboard,ListTodo,Flag,BookOpen,Dumbbell,Moon,Wallet,NotebookPen,CalendarRange,Settings, type LucideIcon} from 'lucide-react';
export const navItems: {id:string;label:string;icon:LucideIcon;group:string}[]=[
 {id:'dashboard',label:'生活驾驶舱',icon:LayoutDashboard,group:'概览'},
 {id:'tasks',label:'今日任务',icon:ListTodo,group:'生活管理'},
 {id:'projects',label:'长期主线',icon:Flag,group:'生活管理'},
 {id:'study',label:'学习与论文',icon:BookOpen,group:'生活管理'},
 {id:'fitness',label:'健身训练',icon:Dumbbell,group:'生活管理'},
 {id:'sleep',label:'睡眠与精力',icon:Moon,group:'生活管理'},
 {id:'finance',label:'财务总览',icon:Wallet,group:'生活管理'},
 {id:'journal',label:'每日复盘',icon:NotebookPen,group:'回顾与成长'},
 {id:'weekly',label:'每周复盘',icon:CalendarRange,group:'回顾与成长'},
 {id:'profile',label:'个人设置',icon:Settings,group:'设置'},
];
export function Logo({small=false}:{small?:boolean}){return <span className={`brand-symbol ${small?'small':''}`}><svg viewBox="0 0 32 32" fill="none"><path d="M9 7v18h15" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/><path d="M15 19C14 10 21 6 27 7c0 8-4 13-12 12Z" fill="currentColor"/><path d="m14 20 8-8" stroke="#56765a" strokeWidth="1.6" strokeLinecap="round"/></svg></span>}
