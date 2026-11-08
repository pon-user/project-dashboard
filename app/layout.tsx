import type {Metadata,Viewport} from 'next';
import './globals.css';
export const metadata:Metadata={
 title:'プロジェクト・コンパス',
 description:'長期プロジェクトの次の一歩を見つける、個人用進捗ダッシュボード。',
 manifest:'/manifest.webmanifest',
 appleWebApp:{capable:true,title:'コンパス',statusBarStyle:'default'},
 icons:{icon:[{url:'/favicon.svg',type:'image/svg+xml'},{url:'/icons/compass-192.png',sizes:'192x192',type:'image/png'}],apple:[{url:'/icons/compass-180.png',sizes:'180x180',type:'image/png'}]},
};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#12303c'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="ja"><body>{children}</body></html>;}
