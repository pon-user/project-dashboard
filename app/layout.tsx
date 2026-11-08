import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'プロジェクト・コンパス',description:'長期プロジェクトの次の一歩を見つける、個人用進捗ダッシュボード。'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="ja"><body>{children}</body></html>;}
